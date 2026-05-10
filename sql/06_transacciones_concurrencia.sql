-- QuindioFlix – Entrega 2
--
-- Contenido:
--   1. SP_PROCESAR_PAGO          – Procesa un pago de forma atómica con
--                                  SAVEPOINT y manejo de excepciones.
--   2. SP_RENOVACION_MASIVA      – Renueva suscripciones vencidas con
--                                  control de concurrencia SELECT FOR UPDATE.
--   3. SP_TRANSFERIR_PERFIL      – Mueve un perfil entre usuarios de forma
--                                  transaccional (demuestra bloqueos y rollback).
--   4. Demostración de niveles    – READ COMMITTED vs SERIALIZABLE.
--   5. Detección de deadlocks     – Bloque explicativo y estrategia de resolución.

SET SERVEROUTPUT ON SIZE UNLIMITED;

-- 1. SP_PROCESAR_PAGO
-- Propósito : Registra el resultado de un pago recibido desde la pasarela
--             externa. Usa SAVEPOINT para poder revertir parcialmente si
--             la actualización del estado de cuenta falla pero el registro
--             del pago ya fue insertado.
-- Parámetros:
--   p_id_usuario   IN – usuario pagador
--   p_monto        IN – monto cobrado
--   p_metodo       IN – metodo de pago utilizado
--   p_estado       IN – 'EXITOSO' | 'FALLIDO' | 'PENDIENTE'
--   p_id_pago      OUT – id del pago registrado
-- Concurrencia   : SELECT … FOR UPDATE NOWAIT sobre USUARIOS para evitar
--                  que dos procesos actualicen el estado de la misma cuenta
--                  simultáneamente.

CREATE OR REPLACE PROCEDURE SP_PROCESAR_PAGO (
    p_id_usuario  IN  USUARIOS.id_usuario%TYPE,
    p_monto       IN  PAGOS.monto%TYPE,
    p_metodo      IN  PAGOS.metodo_pago%TYPE,
    p_estado      IN  PAGOS.estado_pago%TYPE,
    p_id_pago     OUT PAGOS.id_pago%TYPE
) IS

    v_estado_actual  USUARIOS.estado_cuenta%TYPE;
    v_precio_plan    PLANES.precio_mensual%TYPE;
    v_nuevo_id_pago  NUMBER;

    -- Excepción para bloqueo no disponible (recurso ocupado)
    recurso_bloqueado EXCEPTION;
    PRAGMA EXCEPTION_INIT(recurso_bloqueado, -54);  -- ORA-00054

BEGIN
    -- PASO 1: Bloquear la fila del usuario para evitar conflictos
    -- NOWAIT: si otro proceso ya lo bloquea, fallamos rápido (no esperamos).
    BEGIN
        SELECT u.estado_cuenta, p.precio_mensual
        INTO   v_estado_actual, v_precio_plan
        FROM   USUARIOS u
        JOIN   PLANES   p ON p.id_plan = u.id_plan
        WHERE  u.id_usuario = p_id_usuario
        FOR UPDATE NOWAIT;   -- <── Control de concurrencia
    EXCEPTION
        WHEN recurso_bloqueado THEN
            RAISE_APPLICATION_ERROR(-20005,
                'SP_PROCESAR_PAGO: el registro del usuario '
                || p_id_usuario
                || ' está siendo modificado por otra transacción. '
                || 'Reintente en unos segundos.');
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20005,
                'SP_PROCESAR_PAGO: usuario ' || p_id_usuario || ' no encontrado.');
    END;

    -- PASO 2: Validar monto
    IF p_monto <= 0 THEN
        RAISE_APPLICATION_ERROR(-20005,
            'SP_PROCESAR_PAGO: el monto debe ser mayor a 0.');
    END IF;

    -- PASO 3: SAVEPOINT antes de insertar el pago
    SAVEPOINT sp_antes_pago;

    SELECT seq_pagos.NEXTVAL INTO v_nuevo_id_pago FROM DUAL;

    INSERT INTO PAGOS (
        id_pago, id_usuario, fecha_pago, monto,
        metodo_pago, estado_pago, fecha_vencimiento
    ) VALUES (
        v_nuevo_id_pago,
        p_id_usuario,
        SYSDATE,
        p_monto,
        p_metodo,
        p_estado,
        ADD_MONTHS(SYSDATE, 1)
    );

    p_id_pago := v_nuevo_id_pago;

    -- PASO 4: Actualizar estado de la cuenta según resultado del pago
    -- (El trigger TRG_AUDITORIA_PAGOS ya maneja la lógica de mora,
    --  aquí la reactivación inmediata ante pago exitoso es explícita.)
    IF p_estado = 'EXITOSO' AND v_estado_actual = 'INACTIVO' THEN
        UPDATE USUARIOS
        SET    estado_cuenta = 'ACTIVO'
        WHERE  id_usuario    = p_id_usuario;

        DBMS_OUTPUT.PUT_LINE(
            'SP_PROCESAR_PAGO: cuenta del usuario ' || p_id_usuario
            || ' reactivada por pago exitoso.');
    END IF;

    -- PASO 5: Confirmar toda la transaccion
    COMMIT;

    DBMS_OUTPUT.PUT_LINE(
        'SP_PROCESAR_PAGO: pago #' || v_nuevo_id_pago
        || ' registrado para usuario ' || p_id_usuario
        || ' | Monto: $' || TO_CHAR(p_monto, 'FM99,999,990.00')
        || ' | Estado: ' || p_estado
    );

EXCEPTION
    -- Si algo falla DESPUÉS de insertar el pago, regresamos al savepoint
    -- (el pago queda sin confirmar y el usuario no se ve afectado).
    WHEN OTHERS THEN
        ROLLBACK TO sp_antes_pago;
        DBMS_OUTPUT.PUT_LINE(
            'ERROR en SP_PROCESAR_PAGO – rollback al savepoint: ' || SQLERRM);
        RAISE;
END SP_PROCESAR_PAGO;
/

-- 2. SP_RENOVACION_MASIVA
-- Propósito : Recorre todos los usuarios ACTIVOS cuyo pago venció HOY o antes,
--             calcula el nuevo monto con FN_CALCULAR_MONTO y registra el cobro.
--             Usa COMMIT cada N filas (batch commit) para evitar acumular un
--             undo segment gigante y reducir el tiempo de bloqueo.
-- Parámetros:
--   p_batch_size  IN – cantidad de filas entre cada COMMIT (default 50)
-- Concurrencia   : Cursor con FOR UPDATE SKIP LOCKED para omitir filas que
--                  otra sesión esté procesando simultáneamente.

CREATE OR REPLACE PROCEDURE SP_RENOVACION_MASIVA (
    p_batch_size IN NUMBER DEFAULT 50
) IS

    v_procesados  PLS_INTEGER := 0;
    v_exitosos    PLS_INTEGER := 0;
    v_fallidos    PLS_INTEGER := 0;
    v_monto       NUMBER;
    v_metodo      PAGOS.metodo_pago%TYPE;

    -- Cursor con SKIP LOCKED: omite filas bloqueadas por otra sesión.
    -- Así dos procesos de renovación paralelos no colisionan.
    CURSOR cur_a_renovar IS
        SELECT u.id_usuario,
               u.nombre,
               MAX(pg.fecha_vencimiento) AS ultimo_venc
        FROM   USUARIOS u
        JOIN   PAGOS    pg ON pg.id_usuario = u.id_usuario
        WHERE  u.estado_cuenta = 'ACTIVO'
        AND    pg.estado_pago  = 'EXITOSO'
        GROUP BY u.id_usuario, u.nombre
        HAVING MAX(pg.fecha_vencimiento) <= SYSDATE
        ORDER BY u.id_usuario
        FOR UPDATE OF u.estado_cuenta SKIP LOCKED;

BEGIN
    DBMS_OUTPUT.PUT_LINE('=== RENOVACIÓN MASIVA – ' || TO_CHAR(SYSDATE,'DD/MM/YYYY HH24:MI') || ' ===');

    FOR reg IN cur_a_renovar LOOP

        BEGIN
            SAVEPOINT sp_renovacion_fila;

            -- Calcular monto con descuentos
            v_monto := FN_CALCULAR_MONTO(reg.id_usuario);

            -- Metodo de pago: usar el último exitoso del usuario
            SELECT metodo_pago
            INTO   v_metodo
            FROM   PAGOS
            WHERE  id_usuario  = reg.id_usuario
            AND    estado_pago = 'EXITOSO'
            AND    ROWNUM      = 1
            ORDER BY fecha_pago DESC;

            -- Insertar nuevo pago PENDIENTE
            INSERT INTO PAGOS (
                id_pago, id_usuario, fecha_pago, monto,
                metodo_pago, estado_pago, fecha_vencimiento
            ) VALUES (
                seq_pagos.NEXTVAL,
                reg.id_usuario,
                SYSDATE,
                v_monto,
                v_metodo,
                'PENDIENTE',
                ADD_MONTHS(SYSDATE, 1)
            );

            v_exitosos  := v_exitosos + 1;

        EXCEPTION
            WHEN OTHERS THEN
                ROLLBACK TO sp_renovacion_fila;
                v_fallidos := v_fallidos + 1;
                DBMS_OUTPUT.PUT_LINE(
                    '  ✖ Error renovando usuario ' || reg.id_usuario
                    || ': ' || SQLERRM);
        END;

        v_procesados := v_procesados + 1;

        -- Batch commit: confirmar cada p_batch_size filas
        IF MOD(v_procesados, p_batch_size) = 0 THEN
            COMMIT;
            DBMS_OUTPUT.PUT_LINE(
                '  [COMMIT PARCIAL] ' || v_procesados || ' filas procesadas...');
        END IF;

    END LOOP;

    -- Confirmar las filas restantes del último lote
    COMMIT;

    DBMS_OUTPUT.PUT_LINE('---------------------------------------------------');
    DBMS_OUTPUT.PUT_LINE('  Procesados : ' || v_procesados);
    DBMS_OUTPUT.PUT_LINE('  Exitosos   : ' || v_exitosos);
    DBMS_OUTPUT.PUT_LINE('  Fallidos   : ' || v_fallidos);
    DBMS_OUTPUT.PUT_LINE('=== FIN RENOVACIÓN MASIVA ===');

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('ERROR CRÍTICO en SP_RENOVACION_MASIVA: ' || SQLERRM);
        RAISE;
END SP_RENOVACION_MASIVA;
/

-- 3. SP_TRANSFERIR_PERFIL
-- Propósito : Transfiere un perfil de un usuario origen a un usuario destino.
--             Demuestra uso de múltiples SAVEPOINTs y ROLLBACK parcial.
--             Valida que el destino tenga capacidad de perfiles disponibles.
-- Parámetros:
--   p_id_perfil    IN – perfil a transferir
--   p_id_usuario_dest IN – usuario que recibirá el perfil
-- Concurrencia   : FOR UPDATE en ambas filas de usuario para serializar
--                  modificaciones concurrentes.

CREATE OR REPLACE PROCEDURE SP_TRANSFERIR_PERFIL (
    p_id_perfil       IN PERFILES.id_perfil%TYPE,
    p_id_usuario_dest IN USUARIOS.id_usuario%TYPE
) IS

    v_id_usuario_orig  USUARIOS.id_usuario%TYPE;
    v_max_dest         PLANES.max_perfiles%TYPE;
    v_perfiles_dest    NUMBER;
    v_nombre_perfil    PERFILES.nombre_perfil%TYPE;

    recurso_bloqueado  EXCEPTION;
    PRAGMA EXCEPTION_INIT(recurso_bloqueado, -54);

BEGIN
    -- Obtener usuario origen del perfil
    BEGIN
        SELECT id_usuario, nombre_perfil
        INTO   v_id_usuario_orig, v_nombre_perfil
        FROM   PERFILES
        WHERE  id_perfil = p_id_perfil;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20005,
                'SP_TRANSFERIR_PERFIL: perfil ' || p_id_perfil || ' no existe.');
    END;

    IF v_id_usuario_orig = p_id_usuario_dest THEN
        DBMS_OUTPUT.PUT_LINE('SP_TRANSFERIR_PERFIL: el perfil ya pertenece al usuario destino.');
        RETURN;
    END IF;

    -- Bloquear AMBAS filas de usuario para evitar conflictos
    SAVEPOINT sp_inicio_transferencia;

    BEGIN
        -- Bloquear usuario con id menor primero (convención anti-deadlock)
        IF LEAST(v_id_usuario_orig, p_id_usuario_dest) = v_id_usuario_orig THEN
            SELECT id_usuario INTO v_id_usuario_orig
            FROM   USUARIOS WHERE id_usuario = v_id_usuario_orig FOR UPDATE NOWAIT;

            SELECT id_usuario INTO p_id_usuario_dest
            FROM   USUARIOS WHERE id_usuario = p_id_usuario_dest FOR UPDATE NOWAIT;
        ELSE
            SELECT id_usuario INTO p_id_usuario_dest
            FROM   USUARIOS WHERE id_usuario = p_id_usuario_dest FOR UPDATE NOWAIT;

            SELECT id_usuario INTO v_id_usuario_orig
            FROM   USUARIOS WHERE id_usuario = v_id_usuario_orig FOR UPDATE NOWAIT;
        END IF;
    EXCEPTION
        WHEN recurso_bloqueado THEN
            ROLLBACK TO sp_inicio_transferencia;
            RAISE_APPLICATION_ERROR(-20005,
                'SP_TRANSFERIR_PERFIL: uno de los usuarios está siendo '
                || 'modificado. Reintente.');
    END;

    -- Validar capacidad del destino
    SELECT p.max_perfiles INTO v_max_dest
    FROM   USUARIOS u JOIN PLANES p ON p.id_plan = u.id_plan
    WHERE  u.id_usuario = p_id_usuario_dest;

    SELECT COUNT(*) INTO v_perfiles_dest
    FROM   PERFILES WHERE id_usuario = p_id_usuario_dest;

    IF v_perfiles_dest >= v_max_dest THEN
        ROLLBACK TO sp_inicio_transferencia;
        RAISE_APPLICATION_ERROR(-20002,
            'SP_TRANSFERIR_PERFIL: el usuario destino ' || p_id_usuario_dest
            || ' ya alcanzó su límite de ' || v_max_dest || ' perfiles.');
    END IF;

    -- Realizar la transferencia
    SAVEPOINT sp_antes_update;

    UPDATE PERFILES
    SET    id_usuario = p_id_usuario_dest
    WHERE  id_perfil  = p_id_perfil;

    COMMIT;

    DBMS_OUTPUT.PUT_LINE(
        'SP_TRANSFERIR_PERFIL: perfil "' || v_nombre_perfil
        || '" (id=' || p_id_perfil || ') transferido del usuario '
        || v_id_usuario_orig || ' al usuario ' || p_id_usuario_dest || '.'
    );

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK TO sp_inicio_transferencia;
        DBMS_OUTPUT.PUT_LINE('ERROR en SP_TRANSFERIR_PERFIL: ' || SQLERRM);
        RAISE;
END SP_TRANSFERIR_PERFIL;
/

-- 4. DEMOSTRACIÓN DE NIVELES DE AISLAMIENTO
-- Contexto teórico y scripts para ilustrar READ COMMITTED vs SERIALIZABLE
-- en el motor Oracle de QuindioFlix.

-- 4.1 READ COMMITTED (nivel por defecto en Oracle)
--     • Cada lectura ve la última versión CONFIRMADA de cada fila.
--     • Puede producir "lecturas no repetibles": si la Sesión A lee el saldo
--       dos veces y la Sesión B confirma un cambio en medio, A verá valores
--       distintos en cada lectura.


/*
-- SESIÓN A (nivel por defecto READ COMMITTED):
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

SELECT estado_cuenta FROM USUARIOS WHERE id_usuario = 1;
-- Resultado: ACTIVO

-- [Sesión B confirma UPDATE poniendo INACTIVO al mismo usuario]

SELECT estado_cuenta FROM USUARIOS WHERE id_usuario = 1;
-- Resultado: INACTIVO  ← lectura no repetible (fenómeno visible en READ COMMITTED)

ROLLBACK;
*/


-- 4.2 SERIALIZABLE
--     • Toda la transacción ve un snapshot consistente tomado al inicio.
--     • Elimina lecturas no repetibles y lecturas fantasma.
--     • Puede producir ORA-08177 si intenta modificar filas cambiadas por otros.

/*
-- SESIÓN A (SERIALIZABLE):
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

SELECT estado_cuenta FROM USUARIOS WHERE id_usuario = 1;
-- Resultado: ACTIVO

-- [Sesión B confirma UPDATE poniendo INACTIVO al mismo usuario]

SELECT estado_cuenta FROM USUARIOS WHERE id_usuario = 1;
-- Resultado: ACTIVO  ← snapshot inicial, no ve el cambio de B

-- Si A intenta UPDATE sobre esa misma fila → ORA-08177: can't serialize access

ROLLBACK;
*/

-- 4.3 Bloque ejecutable: comparación de niveles en un escenario de facturación


DECLARE
    v_estado_1  USUARIOS.estado_cuenta%TYPE;
    v_estado_2  USUARIOS.estado_cuenta%TYPE;
    v_nivel     VARCHAR2(30) := 'READ COMMITTED'; -- documentativo
BEGIN
    -- READ COMMITTED (comportamiento por defecto de Oracle)
    -- Cada SELECT obtiene la versión confirmada más reciente.
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

    SELECT estado_cuenta INTO v_estado_1
    FROM   USUARIOS WHERE id_usuario = 1;

    -- Simular pausa larga donde otra sesión podría confirmar cambios
    DBMS_LOCK.SLEEP(0);  -- sleep 0 = no pausa real, solo ilustrativo

    SELECT estado_cuenta INTO v_estado_2
    FROM   USUARIOS WHERE id_usuario = 1;

    DBMS_OUTPUT.PUT_LINE('[' || v_nivel || '] Primera lectura  : ' || v_estado_1);
    DBMS_OUTPUT.PUT_LINE('[' || v_nivel || '] Segunda lectura  : ' || v_estado_2);
    DBMS_OUTPUT.PUT_LINE(
        '[' || v_nivel || '] ¿Lectura no repetible posible?: SÍ'
    );

    COMMIT;

    -- SERIALIZABLE: ambas lecturas siempre devuelven el mismo valor
    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

    SELECT estado_cuenta INTO v_estado_1
    FROM   USUARIOS WHERE id_usuario = 1;

    SELECT estado_cuenta INTO v_estado_2
    FROM   USUARIOS WHERE id_usuario = 1;

    DBMS_OUTPUT.PUT_LINE('[SERIALIZABLE] Primera lectura  : ' || v_estado_1);
    DBMS_OUTPUT.PUT_LINE('[SERIALIZABLE] Segunda lectura  : ' || v_estado_2);
    DBMS_OUTPUT.PUT_LINE(
        '[SERIALIZABLE] ¿Lectura no repetible posible?: NO (snapshot fijo)'
    );

    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('Error en demostración niveles: ' || SQLERRM);
END;
/

-- 5. ESTRATEGIA ANTI-DEADLOCK
-- Problema: dos sesiones pueden causar deadlock si bloquean filas en orden
--           inverso. Ejemplo real en QuindioFlix:
--
--   Sesión A: FOR UPDATE en usuario 1, luego usuario 2
--   Sesión B: FOR UPDATE en usuario 2, luego usuario 1
--   → Ciclo de espera → deadlock → Oracle cancela una de las dos.
--
-- Solución implementada en SP_TRANSFERIR_PERFIL:
--   Siempre bloquear el usuario con id MENOR primero, ambas sesiones
--   siguen el mismo orden → no puede formarse ciclo.


-- Bloque ilustrativo de detección y recuperación de deadlock
DECLARE
    v_dummy NUMBER;
BEGIN
    -- Simulación: intentar bloquear dos filas en el orden "seguro"
    SAVEPOINT sp_anti_deadlock;

    -- Orden fijo: id menor primero
    SELECT id_usuario INTO v_dummy FROM USUARIOS WHERE id_usuario = 1 FOR UPDATE NOWAIT;
    SELECT id_usuario INTO v_dummy FROM USUARIOS WHERE id_usuario = 2 FOR UPDATE NOWAIT;

    -- Operaciones sobre ambas filas...
    DBMS_OUTPUT.PUT_LINE('Anti-deadlock: bloqueos obtenidos en orden seguro (1 → 2).');

    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        -- ORA-00054: recurso ocupado o ORA-00060: deadlock detectado
        ROLLBACK TO sp_anti_deadlock;
        IF SQLCODE = -54 THEN
            DBMS_OUTPUT.PUT_LINE('Recurso ocupado por otra sesión. Reintente más tarde.');
        ELSIF SQLCODE = -60 THEN
            DBMS_OUTPUT.PUT_LINE('Deadlock detectado. Transacción revertida al savepoint.');
        ELSE
            DBMS_OUTPUT.PUT_LINE('Error inesperado: ' || SQLERRM);
        END IF;
END;
/

-- 6. BLOQUE DE PRUEBA COMPLETO (opcional – ejecutar independientemente)

/*
-- Prueba SP_PROCESAR_PAGO (exitoso)
DECLARE
    v_id_pago NUMBER;
BEGIN
    SP_PROCESAR_PAGO(
        p_id_usuario => 11,
        p_monto      => 14900,
        p_metodo     => 'NEQUI',
        p_estado     => 'EXITOSO',
        p_id_pago    => v_id_pago
    );
    DBMS_OUTPUT.PUT_LINE('Pago generado: ' || v_id_pago);
END;
/

-- Prueba SP_PROCESAR_PAGO (fallido sobre cuenta que ya venció > 30 días)
DECLARE
    v_id_pago NUMBER;
BEGIN
    SP_PROCESAR_PAGO(
        p_id_usuario => 12,    -- usuario con pagos fallidos en los datos de prueba
        p_monto      => 14900,
        p_metodo     => 'PSE',
        p_estado     => 'FALLIDO',
        p_id_pago    => v_id_pago
    );
END;
/

-- Prueba SP_RENOVACION_MASIVA
EXEC SP_RENOVACION_MASIVA(p_batch_size => 10);

-- Prueba SP_TRANSFERIR_PERFIL
-- Mover perfil 20 (usuario 20) al usuario 14 que tiene cupo
EXEC SP_TRANSFERIR_PERFIL(p_id_perfil => 20, p_id_usuario_dest => 14);

-- Verificar auditoría
SELECT tabla_afectada, operacion, descripcion, TO_CHAR(fecha_evento,'DD/MM HH24:MI:SS') AS ts
FROM   AUDITORIA_QUINDIOFLIX
ORDER BY fecha_evento DESC
FETCH FIRST 30 ROWS ONLY;
*/
