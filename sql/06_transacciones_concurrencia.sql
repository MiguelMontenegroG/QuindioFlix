-- =============================================================================
-- QuindioFlix – Entrega 3
-- Archivo 06: TRANSACCIONES Y CONCURRENCIA  (NT3)
--
-- Núcleo 3 · R.A.1 — Administrar componentes fundamentales
--
-- Transacciones implementadas:
--   TXN-1  SP_REGISTRAR_USUARIO_COMPLETO   – Registro atómico (usuario+perfil+pago)
--   TXN-2  SP_RENOVACION_MENSUAL           – Renovación con SAVEPOINT por fila
--   TXN-3  SP_ELIMINAR_CUENTA             – Eliminación total todo-o-nada
--
-- Escenario de concurrencia:
--   DEMO_CONCURRENCIA_PLAN                – Dos sesiones cambian el plan del
--                                           mismo usuario; resuelta con FOR UPDATE
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA DE AUDITORÍA (si no existe aún del archivo 05)
-- ─────────────────────────────────────────────────────────────────────────────
-- Si ya fue creada en 05_triggers_excepciones.sql, esta sentencia lanzará
-- ORA-00955 (ignorable al ejecutar el script completo).
-- En Oracle 23c se puede usar CREATE TABLE IF NOT EXISTS.
-- Para compatibilidad con 19c se protege con bloque PL/SQL:
BEGIN
    EXECUTE IMMEDIATE '
        CREATE TABLE AUDITORIA_QUINDIOFLIX (
            id_auditoria   NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            tabla_afectada VARCHAR2(50)    NOT NULL,
            operacion      VARCHAR2(10)    NOT NULL,
            id_registro    NUMBER,
            descripcion    VARCHAR2(500),
            fecha_evento   TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,
            usuario_bd     VARCHAR2(100)   DEFAULT USER         NOT NULL
        )
    ';
    DBMS_OUTPUT.PUT_LINE('Tabla AUDITORIA_QUINDIOFLIX creada.');
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -955 THEN   -- ORA-00955: name is already used by an existing object
            DBMS_OUTPUT.PUT_LINE('AUDITORIA_QUINDIOFLIX ya existe — se continúa.');
        ELSE
            RAISE;
        END IF;
END;
/


-- =============================================================================
-- TXN-1: SP_REGISTRAR_USUARIO_COMPLETO
-- =============================================================================
-- Descripción  : Crea un nuevo usuario junto con su perfil ADULTO por defecto
--                y genera el primer pago PENDIENTE. Es una transacción atómica:
--                si cualquier paso falla, se revierte todo (ROLLBACK completo).
--
-- Estados de la transacción:
--   ACTIVA              → desde el INSERT de USUARIOS hasta el COMMIT
--   PARCIALMENTE CONFIRMADA → justo antes del COMMIT (todos los INSERTs OK)
--   CONFIRMADA          → tras COMMIT exitoso
--   FALLIDA             → si alguna validación lanza RAISE_APPLICATION_ERROR
--   ABORTADA            → ROLLBACK en el bloque EXCEPTION WHEN OTHERS
--
-- Parámetros:
--   p_nombre, p_email, p_telefono, p_fnac, p_ciudad  – datos del usuario
--   p_id_plan      – plan elegido (1=Básico, 2=Estándar, 3=Premium)
--   p_id_referidor – usuario referidor (NULL si ninguno)
--   p_metodo_pago  – método del primer pago
--   p_id_usuario   OUT – id generado
-- =============================================================================

CREATE OR REPLACE PROCEDURE SP_REGISTRAR_USUARIO_COMPLETO (
    p_nombre       IN  USUARIOS.nombre%TYPE,
    p_email        IN  USUARIOS.email%TYPE,
    p_telefono     IN  USUARIOS.telefono%TYPE,
    p_fnac         IN  USUARIOS.fecha_nacimiento%TYPE,
    p_ciudad       IN  USUARIOS.ciudad%TYPE,
    p_id_plan      IN  USUARIOS.id_plan%TYPE,
    p_id_referidor IN  USUARIOS.id_referidor%TYPE DEFAULT NULL,
    p_metodo_pago  IN  PAGOS.metodo_pago%TYPE     DEFAULT 'PSE',
    p_id_usuario   OUT USUARIOS.id_usuario%TYPE
) IS
    -- ── Variables locales ──────────────────────────────────────────────────
    v_email_existe   NUMBER;
    v_plan_existe    NUMBER;
    v_ref_activo     NUMBER;
    v_precio_base    PLANES.precio_mensual%TYPE;
    v_monto_pago     NUMBER;
    v_nuevo_id       NUMBER;
    v_nuevo_perfil   NUMBER;
    v_nuevo_pago     NUMBER;

BEGIN
    -- ════════════════════════════════════════════════════════════════════════
    -- ESTADO: ACTIVA  (la transacción comienza aquí)
    -- ════════════════════════════════════════════════════════════════════════

    -- PASO 1 — Validaciones previas (sin DML todavía)
    IF p_nombre   IS NULL OR p_email  IS NULL OR
       p_telefono IS NULL OR p_fnac   IS NULL OR p_ciudad IS NULL THEN
        -- ESTADO: FALLIDA → el RAISE aborta antes de cualquier DML
        RAISE_APPLICATION_ERROR(-20005,
            'TXN-1: todos los campos obligatorios deben tener valor.');
    END IF;

    SELECT COUNT(*) INTO v_email_existe
    FROM USUARIOS WHERE email = LOWER(TRIM(p_email));
    IF v_email_existe > 0 THEN
        RAISE_APPLICATION_ERROR(-20001,
            'TXN-1: el email "' || p_email || '" ya está registrado.');
    END IF;

    SELECT COUNT(*) INTO v_plan_existe
    FROM PLANES WHERE id_plan = p_id_plan;
    IF v_plan_existe = 0 THEN
        RAISE_APPLICATION_ERROR(-20006,
            'TXN-1: el plan ' || p_id_plan || ' no existe.');
    END IF;

    IF p_id_referidor IS NOT NULL THEN
        SELECT COUNT(*) INTO v_ref_activo
        FROM USUARIOS
        WHERE id_usuario = p_id_referidor AND estado_cuenta = 'ACTIVO';
        IF v_ref_activo = 0 THEN
            RAISE_APPLICATION_ERROR(-20005,
                'TXN-1: el referidor ' || p_id_referidor
                || ' no existe o está INACTIVO.');
        END IF;
    END IF;

    SELECT precio_mensual INTO v_precio_base
    FROM PLANES WHERE id_plan = p_id_plan;

    -- PASO 2 — INSERT en USUARIOS  ← primera operación DML de la transacción
    SELECT seq_usuarios.NEXTVAL INTO v_nuevo_id FROM DUAL;

    INSERT INTO USUARIOS (
        id_usuario, nombre, email, telefono,
        fecha_nacimiento, ciudad, estado_cuenta,
        fecha_registro, id_plan, id_referidor
    ) VALUES (
        v_nuevo_id, TRIM(p_nombre), LOWER(TRIM(p_email)), p_telefono,
        p_fnac, TRIM(p_ciudad), 'ACTIVO',
        SYSDATE, p_id_plan, p_id_referidor
    );
    DBMS_OUTPUT.PUT_LINE('[TXN-1] PASO 2 OK — usuario ' || v_nuevo_id || ' insertado.');

    -- PASO 3 — INSERT en PERFILES (perfil ADULTO por defecto)
    -- Si este falla, el ROLLBACK en EXCEPTION deshace también el INSERT previo.
    SELECT seq_perfiles.NEXTVAL INTO v_nuevo_perfil FROM DUAL;

    INSERT INTO PERFILES (id_perfil, id_usuario, nombre_perfil, avatar, tipo)
    VALUES (v_nuevo_perfil, v_nuevo_id,
            SUBSTR(TRIM(p_nombre), 1, 50), 'default.png', 'ADULTO');
    DBMS_OUTPUT.PUT_LINE('[TXN-1] PASO 3 OK — perfil ' || v_nuevo_perfil || ' creado.');

    -- PASO 4 — INSERT en PAGOS (primer pago PENDIENTE)
    v_monto_pago := CASE WHEN p_id_referidor IS NOT NULL
                         THEN ROUND(v_precio_base * 0.85, 2)   -- 15 % descuento referido
                         ELSE v_precio_base
                    END;

    SELECT seq_pagos.NEXTVAL INTO v_nuevo_pago FROM DUAL;

    INSERT INTO PAGOS (
        id_pago, id_usuario, fecha_pago, monto,
        metodo_pago, estado_pago, fecha_vencimiento
    ) VALUES (
        v_nuevo_pago, v_nuevo_id, SYSDATE, v_monto_pago,
        p_metodo_pago, 'PENDIENTE', ADD_MONTHS(SYSDATE, 1)
    );
    DBMS_OUTPUT.PUT_LINE('[TXN-1] PASO 4 OK — pago ' || v_nuevo_pago
        || ' por $' || v_monto_pago || ' generado.');

    -- Auditar
    INSERT INTO AUDITORIA_QUINDIOFLIX (tabla_afectada, operacion, id_registro, descripcion)
    VALUES ('USUARIOS', 'INSERT', v_nuevo_id,
            'TXN-1: registro completo. Usuario=' || v_nuevo_id
            || ', Perfil=' || v_nuevo_perfil || ', Pago=' || v_nuevo_pago);

    -- ════════════════════════════════════════════════════════════════════════
    -- ESTADO: PARCIALMENTE CONFIRMADA  (todos los pasos DML completados,
    --         buffer listo para confirmar)
    -- ════════════════════════════════════════════════════════════════════════
    COMMIT;
    -- ════════════════════════════════════════════════════════════════════════
    -- ESTADO: CONFIRMADA
    -- ════════════════════════════════════════════════════════════════════════

    p_id_usuario := v_nuevo_id;
    DBMS_OUTPUT.PUT_LINE('[TXN-1] ✔ COMMIT — usuario '
        || v_nuevo_id || ' registrado exitosamente.');

EXCEPTION
    WHEN OTHERS THEN
        -- ══════════════════════════════════════════════════════════════════
        -- ESTADO: ABORTADA  → deshace TODOS los DML de esta transacción
        -- ══════════════════════════════════════════════════════════════════
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('[TXN-1] ✖ ROLLBACK — ' || SQLERRM);
        RAISE;
END SP_REGISTRAR_USUARIO_COMPLETO;
/


-- =============================================================================
-- TXN-2: SP_RENOVACION_MENSUAL
-- =============================================================================
-- Descripción  : Recorre los usuarios ACTIVOS con suscripción vencida, verifica
--                la fecha de vencimiento, calcula el monto con FN_CALCULAR_MONTO
--                y registra el nuevo ciclo de pago.
--
--                Usa SAVEPOINT por cada usuario:
--                  • Si falla un usuario → ROLLBACK TO savepoint de ese usuario
--                    (los anteriores ya quedaron en el buffer del batch)
--                  • Cada p_batch_size usuarios → COMMIT parcial (batch commit)
--
-- Estados de la transacción:
--   ACTIVA              → al abrir el cursor
--   (por usuario)
--     ACTIVA            → dentro del loop, antes del SAVEPOINT fila
--     PARCIALMENTE CONF → INSERT de pago exitoso, antes de COMMIT batch
--     CONFIRMADA        → tras cada COMMIT batch
--     FALLIDA           → si falla el cálculo o el INSERT de un usuario
--     ABORTADA          → ROLLBACK TO savepoint_fila (solo ese usuario)
--   (global)
--     CONFIRMADA        → COMMIT final al salir del loop
--     ABORTADA          → ROLLBACK en EXCEPTION WHEN OTHERS del bloque externo
--
-- Parámetros:
--   p_batch_size – filas entre cada COMMIT parcial (default 50)
-- Concurrencia  : FOR UPDATE SKIP LOCKED — otra sesión paralela salta filas
--                 que este proceso ya tiene bloqueadas.
-- =============================================================================

CREATE OR REPLACE PROCEDURE SP_RENOVACION_MENSUAL (
    p_batch_size IN NUMBER DEFAULT 50
) IS

    v_procesados   PLS_INTEGER := 0;
    v_exitosos     PLS_INTEGER := 0;
    v_fallidos     PLS_INTEGER := 0;
    v_monto        NUMBER;
    v_metodo       PAGOS.metodo_pago%TYPE;
    v_nuevo_pago   NUMBER;

    CURSOR cur_vencidos IS
        SELECT  u.id_usuario,
                u.nombre,
                MAX(pg.fecha_vencimiento) AS ultimo_venc
        FROM    USUARIOS u
        JOIN    PAGOS    pg ON pg.id_usuario = u.id_usuario
        WHERE   u.estado_cuenta = 'ACTIVO'
        AND     pg.estado_pago  = 'EXITOSO'
        GROUP   BY u.id_usuario, u.nombre
        HAVING  MAX(pg.fecha_vencimiento) <= SYSDATE
        ORDER   BY u.id_usuario
        FOR UPDATE OF u.estado_cuenta SKIP LOCKED;   -- ← control de concurrencia

BEGIN
    DBMS_OUTPUT.PUT_LINE('════════════════════════════════════════════════════');
    DBMS_OUTPUT.PUT_LINE('[TXN-2] INICIO RENOVACIÓN MENSUAL — '
        || TO_CHAR(SYSDATE,'DD/MM/YYYY HH24:MI:SS'));
    DBMS_OUTPUT.PUT_LINE('════════════════════════════════════════════════════');

    -- ════════════════════════════════════════════════════════════════════════
    -- ESTADO GLOBAL: ACTIVA
    -- ════════════════════════════════════════════════════════════════════════

    FOR reg IN cur_vencidos LOOP

        -- ── SAVEPOINT por usuario ──────────────────────────────────────────
        SAVEPOINT sp_usuario_fila;
        -- ESTADO (usuario actual): ACTIVA

        BEGIN
            -- Verificar vencimiento (regla de negocio)
            IF reg.ultimo_venc > SYSDATE THEN
                DBMS_OUTPUT.PUT_LINE('  [SKIP] Usuario ' || reg.id_usuario
                    || ': vencimiento en el futuro (' || reg.ultimo_venc || ')');
                GOTO siguiente_usuario;
            END IF;

            -- Calcular monto con descuentos aplicables
            v_monto := FN_CALCULAR_MONTO(reg.id_usuario);

            -- Método de pago: el último exitoso registrado
            BEGIN
                SELECT metodo_pago INTO v_metodo
                FROM (
                    SELECT metodo_pago
                    FROM   PAGOS
                    WHERE  id_usuario  = reg.id_usuario
                    AND    estado_pago = 'EXITOSO'
                    ORDER BY fecha_pago DESC
                )
                WHERE ROWNUM = 1;
            EXCEPTION
                WHEN NO_DATA_FOUND THEN
                    v_metodo := 'PSE';   -- método por defecto si no hay registro
            END;

            -- Registrar nuevo ciclo como PENDIENTE
            SELECT seq_pagos.NEXTVAL INTO v_nuevo_pago FROM DUAL;

            INSERT INTO PAGOS (
                id_pago, id_usuario, fecha_pago, monto,
                metodo_pago, estado_pago, fecha_vencimiento
            ) VALUES (
                v_nuevo_pago, reg.id_usuario, SYSDATE, v_monto,
                v_metodo, 'PENDIENTE', ADD_MONTHS(SYSDATE, 1)
            );

            -- Auditar
            INSERT INTO AUDITORIA_QUINDIOFLIX
                (tabla_afectada, operacion, id_registro, descripcion)
            VALUES ('PAGOS', 'INSERT', v_nuevo_pago,
                    'TXN-2: renovación usuario ' || reg.id_usuario
                    || ' | monto $' || v_monto);

            v_exitosos := v_exitosos + 1;
            DBMS_OUTPUT.PUT_LINE('  [OK] Usuario ' || reg.id_usuario
                || ' — ' || reg.nombre
                || ' | Vencía: ' || TO_CHAR(reg.ultimo_venc,'DD/MM/YYYY')
                || ' | Monto: $' || v_monto
                || ' | Pago#: ' || v_nuevo_pago);

        EXCEPTION
            WHEN OTHERS THEN
                -- ════════════════════════════════════════════════════════
                -- ESTADO (usuario actual): ABORTADA
                -- Solo se revierte la operación de este usuario
                -- ════════════════════════════════════════════════════════
                ROLLBACK TO sp_usuario_fila;
                v_fallidos := v_fallidos + 1;
                DBMS_OUTPUT.PUT_LINE('  [FAIL] Usuario ' || reg.id_usuario
                    || ': ' || SQLERRM || ' — ROLLBACK TO sp_usuario_fila');
        END;

        <<siguiente_usuario>>
        v_procesados := v_procesados + 1;

        -- Batch commit cada p_batch_size filas
        IF MOD(v_procesados, p_batch_size) = 0 THEN
            COMMIT;
            -- ESTADO GLOBAL (lote): PARCIALMENTE CONFIRMADA → CONFIRMADA
            DBMS_OUTPUT.PUT_LINE('  [COMMIT BATCH] ' || v_procesados
                || ' usuarios procesados...');
        END IF;

    END LOOP;

    -- COMMIT del lote final
    COMMIT;
    -- ════════════════════════════════════════════════════════════════════════
    -- ESTADO GLOBAL: CONFIRMADA
    -- ════════════════════════════════════════════════════════════════════════

    DBMS_OUTPUT.PUT_LINE('────────────────────────────────────────────────────');
    DBMS_OUTPUT.PUT_LINE('[TXN-2] Procesados : ' || v_procesados);
    DBMS_OUTPUT.PUT_LINE('[TXN-2] Exitosos   : ' || v_exitosos);
    DBMS_OUTPUT.PUT_LINE('[TXN-2] Fallidos   : ' || v_fallidos);
    DBMS_OUTPUT.PUT_LINE('[TXN-2] ✔ RENOVACIÓN MENSUAL COMPLETADA.');
    DBMS_OUTPUT.PUT_LINE('════════════════════════════════════════════════════');

EXCEPTION
    WHEN OTHERS THEN
        -- ════════════════════════════════════════════════════════════════════
        -- ESTADO GLOBAL: ABORTADA (error crítico fuera del loop interno)
        -- ════════════════════════════════════════════════════════════════════
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('[TXN-2] ✖ ERROR CRÍTICO — ROLLBACK total: ' || SQLERRM);
        RAISE;
END SP_RENOVACION_MENSUAL;
/


-- =============================================================================
-- TXN-3: SP_ELIMINAR_CUENTA
-- =============================================================================
-- Descripción  : Elimina completamente la cuenta de un usuario siguiendo el
--                orden correcto de dependencias de FK:
--                  1. CALIFICACIONES  (dependen de PERFILES y CONTENIDO)
--                  2. FAVORITOS       (dependen de PERFILES y CONTENIDO)
--                  3. REPRODUCCIONES  (dependen de PERFILES y CONTENIDO)
--                  4. REPORTES        (dependen de PERFILES → se actualiza moderador)
--                  5. PERFILES        (dependen de USUARIOS)
--                  6. PAGOS           (dependen de USUARIOS)
--                  7. USUARIOS        (tabla raíz)
--
--                Es una transacción TODO-O-NADA: un SAVEPOINT global al inicio
--                permite revertir absolutamente todo si falla cualquier paso.
--
-- Estados de la transacción:
--   ACTIVA              → desde el SAVEPOINT sp_eliminar_inicio
--   PARCIALMENTE CONF   → todos los DELETE completados, antes del COMMIT
--   CONFIRMADA          → tras COMMIT
--   FALLIDA / ABORTADA  → ROLLBACK TO sp_eliminar_inicio en EXCEPTION
--
-- Parámetros:
--   p_id_usuario   IN – usuario a eliminar
--   p_confirmacion IN – debe enviarse 'CONFIRMAR' (medida de seguridad)
-- =============================================================================

CREATE OR REPLACE PROCEDURE SP_ELIMINAR_CUENTA (
    p_id_usuario   IN USUARIOS.id_usuario%TYPE,
    p_confirmacion IN VARCHAR2
) IS
    v_nombre         USUARIOS.nombre%TYPE;
    v_cal_del        NUMBER := 0;
    v_fav_del        NUMBER := 0;
    v_rep_del        NUMBER := 0;
    v_rep_upd        NUMBER := 0;
    v_perf_del       NUMBER := 0;
    v_pag_del        NUMBER := 0;

    recurso_bloqueado EXCEPTION;
    PRAGMA EXCEPTION_INIT(recurso_bloqueado, -54);

BEGIN
    -- Verificar palabra de confirmación (seguridad operacional)
    IF NVL(p_confirmacion, 'X') <> 'CONFIRMAR' THEN
        RAISE_APPLICATION_ERROR(-20005,
            'TXN-3: debe pasar p_confirmacion => ''CONFIRMAR'' para ejecutar '
            || 'la eliminación de cuenta. Operación cancelada.');
    END IF;

    -- ════════════════════════════════════════════════════════════════════════
    -- ESTADO: ACTIVA  — SAVEPOINT global
    -- ════════════════════════════════════════════════════════════════════════
    SAVEPOINT sp_eliminar_inicio;

    -- Obtener y bloquear la fila del usuario (NOWAIT para concurrencia)
    BEGIN
        SELECT nombre INTO v_nombre
        FROM   USUARIOS
        WHERE  id_usuario = p_id_usuario
        FOR UPDATE NOWAIT;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20005,
                'TXN-3: usuario ' || p_id_usuario || ' no encontrado.');
        WHEN recurso_bloqueado THEN
            RAISE_APPLICATION_ERROR(-20005,
                'TXN-3: el usuario ' || p_id_usuario
                || ' está bloqueado por otra sesión. Reintente.');
    END;

    DBMS_OUTPUT.PUT_LINE('[TXN-3] Iniciando eliminación de "' || v_nombre
        || '" (id=' || p_id_usuario || ')...');

    -- PASO 1 — Eliminar CALIFICACIONES de todos los perfiles del usuario
    DELETE FROM CALIFICACIONES
    WHERE  id_perfil IN (SELECT id_perfil FROM PERFILES WHERE id_usuario = p_id_usuario);
    v_cal_del := SQL%ROWCOUNT;
    DBMS_OUTPUT.PUT_LINE('[TXN-3] PASO 1: ' || v_cal_del || ' calificación(es) eliminada(s).');

    -- PASO 2 — Eliminar FAVORITOS
    DELETE FROM FAVORITOS
    WHERE  id_perfil IN (SELECT id_perfil FROM PERFILES WHERE id_usuario = p_id_usuario);
    v_fav_del := SQL%ROWCOUNT;
    DBMS_OUTPUT.PUT_LINE('[TXN-3] PASO 2: ' || v_fav_del || ' favorito(s) eliminado(s).');

    -- PASO 3 — Eliminar REPRODUCCIONES
    DELETE FROM REPRODUCCIONES
    WHERE  id_perfil IN (SELECT id_perfil FROM PERFILES WHERE id_usuario = p_id_usuario);
    v_rep_del := SQL%ROWCOUNT;
    DBMS_OUTPUT.PUT_LINE('[TXN-3] PASO 3: ' || v_rep_del || ' reproducción(es) eliminada(s).');

    -- PASO 4 — Desvincular REPORTES donde el usuario es moderador
    --          (no se puede eliminar el usuario si hay FK en REPORTES.id_moderador)
    UPDATE REPORTES SET id_moderador = NULL
    WHERE  id_moderador = p_id_usuario;
    v_rep_upd := SQL%ROWCOUNT;
    DBMS_OUTPUT.PUT_LINE('[TXN-3] PASO 4: ' || v_rep_upd || ' reporte(s) desvinculado(s) como moderador.');

    -- PASO 5 — Eliminar PERFILES
    --          Las FK de REPORTES.id_perfil_reportador usarán el CASCADE definido
    --          en PERFILES (ON DELETE CASCADE desde FAVORITOS, REPRODUCCIONES ya
    --          eliminados). REPORTES no tiene CASCADE → eliminamos reportes primero.
    DELETE FROM REPORTES
    WHERE  id_perfil_reportador IN (
               SELECT id_perfil FROM PERFILES WHERE id_usuario = p_id_usuario);
    DBMS_OUTPUT.PUT_LINE('[TXN-3] PASO 5a: reportes propios del usuario eliminados ('
        || SQL%ROWCOUNT || ').');

    DELETE FROM PERFILES WHERE id_usuario = p_id_usuario;
    v_perf_del := SQL%ROWCOUNT;
    DBMS_OUTPUT.PUT_LINE('[TXN-3] PASO 5b: ' || v_perf_del || ' perfil(es) eliminado(s).');

    -- PASO 6 — Eliminar PAGOS
    DELETE FROM PAGOS WHERE id_usuario = p_id_usuario;
    v_pag_del := SQL%ROWCOUNT;
    DBMS_OUTPUT.PUT_LINE('[TXN-3] PASO 6: ' || v_pag_del || ' pago(s) eliminado(s).');

    -- PASO 7 — Eliminar fila de USUARIOS que referencian a este como referidor
    UPDATE USUARIOS SET id_referidor = NULL
    WHERE  id_referidor = p_id_usuario;
    DBMS_OUTPUT.PUT_LINE('[TXN-3] PASO 7a: referencias de referidor limpiadas ('
        || SQL%ROWCOUNT || ').');

    -- PASO 7b — Eliminar el USUARIO
    DELETE FROM USUARIOS WHERE id_usuario = p_id_usuario;
    DBMS_OUTPUT.PUT_LINE('[TXN-3] PASO 7b: usuario ' || p_id_usuario || ' eliminado.');

    -- Auditar antes del COMMIT
    INSERT INTO AUDITORIA_QUINDIOFLIX (tabla_afectada, operacion, id_registro, descripcion)
    VALUES ('USUARIOS', 'DELETE', p_id_usuario,
            'TXN-3: cuenta eliminada. Cal=' || v_cal_del
            || ', Fav=' || v_fav_del || ', Repr=' || v_rep_del
            || ', Perf=' || v_perf_del || ', Pagos=' || v_pag_del);

    -- ════════════════════════════════════════════════════════════════════════
    -- ESTADO: PARCIALMENTE CONFIRMADA
    -- ════════════════════════════════════════════════════════════════════════
    COMMIT;
    -- ════════════════════════════════════════════════════════════════════════
    -- ESTADO: CONFIRMADA
    -- ════════════════════════════════════════════════════════════════════════
    DBMS_OUTPUT.PUT_LINE('[TXN-3] ✔ COMMIT — cuenta "' || v_nombre || '" eliminada exitosamente.');

EXCEPTION
    WHEN OTHERS THEN
        -- ════════════════════════════════════════════════════════════════════
        -- ESTADO: ABORTADA — se revierte TODO desde el SAVEPOINT inicial
        -- ════════════════════════════════════════════════════════════════════
        ROLLBACK TO sp_eliminar_inicio;
        DBMS_OUTPUT.PUT_LINE('[TXN-3] ✖ ROLLBACK — la cuenta NO fue eliminada. '
            || SQLERRM);
        RAISE;
END SP_ELIMINAR_CUENTA;
/


-- =============================================================================
-- ESCENARIO DE CONCURRENCIA — Cambio simultáneo de plan
-- =============================================================================
-- Problema     : Dos sesiones intentan cambiar el plan del usuario id=7
--               simultáneamente. Sin control, podrían aplicarse dos cambios
--               inconsistentes (last-write-wins sin validación).
--
-- Solución     : SELECT … FOR UPDATE NOWAIT bloquea la fila del usuario en
--               la primera sesión; la segunda recibe ORA-00054 inmediatamente
--               y puede reintentar en lugar de esperar indefinidamente.
--
-- Cómo ejecutar la demostración:
--   — Abrir DOS ventanas de SQL*Plus / SQL Developer conectadas al esquema.
--   — Ejecutar el Bloque A en la Sesión A.
--   — Antes de que la Sesión A haga COMMIT, ejecutar el Bloque B en la Sesión B.
--   — Observar el error ORA-20005 en la Sesión B.
--   — Ejecutar COMMIT en la Sesión A.
--   — Ejecutar de nuevo el Bloque B (ahora tiene éxito).
-- =============================================================================

/*
───────────────────────────────────────────────────────────────
SESIÓN A — Inicia el cambio de plan del usuario 7 a Premium
───────────────────────────────────────────────────────────────
*/

-- BLOQUE SESIÓN A (ejecutar primero y NO hacer COMMIT todavía):
DECLARE
    v_estado    USUARIOS.estado_cuenta%TYPE;
    v_plan_act  PLANES.nombre_plan%TYPE;

    recurso_bloqueado EXCEPTION;
    PRAGMA EXCEPTION_INIT(recurso_bloqueado, -54);
BEGIN
    DBMS_OUTPUT.PUT_LINE('[SESIÓN A] Intentando bloquear usuario 7...');

    -- FOR UPDATE NOWAIT: bloquea la fila o falla inmediatamente
    SELECT u.estado_cuenta, p.nombre_plan
    INTO   v_estado, v_plan_act
    FROM   USUARIOS u
    JOIN   PLANES   p ON p.id_plan = u.id_plan
    WHERE  u.id_usuario = 7
    FOR UPDATE NOWAIT;   -- ← bloqueo exclusivo

    DBMS_OUTPUT.PUT_LINE('[SESIÓN A] Fila bloqueada. Plan actual: '
        || v_plan_act || ' | Estado: ' || v_estado);

    -- Cambiar plan a Premium (id=3)
    UPDATE USUARIOS SET id_plan = 3 WHERE id_usuario = 7;

    DBMS_OUTPUT.PUT_LINE('[SESIÓN A] UPDATE aplicado. Esperando COMMIT...');
    -- *** NO ejecutar COMMIT aún — dejar la sesión en este estado ***
    -- COMMIT;
EXCEPTION
    WHEN recurso_bloqueado THEN
        DBMS_OUTPUT.PUT_LINE('[SESIÓN A] ERROR ORA-00054: fila ocupada por otra sesión.');
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('[SESIÓN A] ERROR: ' || SQLERRM);
END;
/

/*
───────────────────────────────────────────────────────────────
SESIÓN B — Intenta cambiar el mismo usuario 7 a Básico
(ejecutar MIENTRAS la Sesión A aún no hizo COMMIT)
───────────────────────────────────────────────────────────────
*/

-- BLOQUE SESIÓN B:
DECLARE
    v_estado    USUARIOS.estado_cuenta%TYPE;
    v_plan_act  PLANES.nombre_plan%TYPE;

    recurso_bloqueado EXCEPTION;
    PRAGMA EXCEPTION_INIT(recurso_bloqueado, -54);
BEGIN
    DBMS_OUTPUT.PUT_LINE('[SESIÓN B] Intentando bloquear usuario 7...');

    SELECT u.estado_cuenta, p.nombre_plan
    INTO   v_estado, v_plan_act
    FROM   USUARIOS u
    JOIN   PLANES   p ON p.id_plan = u.id_plan
    WHERE  u.id_usuario = 7
    FOR UPDATE NOWAIT;   -- ← falla si la Sesión A ya tiene el bloqueo

    DBMS_OUTPUT.PUT_LINE('[SESIÓN B] Fila bloqueada. Aplicando cambio...');
    UPDATE USUARIOS SET id_plan = 1 WHERE id_usuario = 7;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('[SESIÓN B] ✔ Cambio aplicado.');
EXCEPTION
    WHEN recurso_bloqueado THEN
        -- ────────────────────────────────────────────────────────────────
        -- RESULTADO ESPERADO: ORA-00054 — resource busy and acquire with
        -- NOWAIT specified or timeout expired.
        -- Oracle bloqueó la fila para Sesión A; Sesión B recibe el error
        -- inmediatamente (no espera) gracias a NOWAIT.
        -- ────────────────────────────────────────────────────────────────
        DBMS_OUTPUT.PUT_LINE(
            '[SESIÓN B] ✖ ORA-00054: la fila del usuario 7 está bloqueada '
            || 'por Sesión A. Reintente después del COMMIT de A.');
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('[SESIÓN B] ERROR inesperado: ' || SQLERRM);
END;
/

-- Luego en Sesión A:
-- COMMIT;
-- (La Sesión B puede ejecutar su bloque de nuevo y tendrá éxito)


-- =============================================================================
-- BLOQUES DE PRUEBA
-- =============================================================================
/*
-- Prueba TXN-1: registro exitoso
DECLARE
    v_id NUMBER;
BEGIN
    SP_REGISTRAR_USUARIO_COMPLETO(
        p_nombre       => 'Prueba Entrega Tres',
        p_email        => 'prueba.e3@quindioflix.co',
        p_telefono     => '3001110000',
        p_fnac         => DATE '1998-03-20',
        p_ciudad       => 'Armenia',
        p_id_plan      => 2,
        p_id_referidor => NULL,
        p_metodo_pago  => 'NEQUI',
        p_id_usuario   => v_id
    );
    DBMS_OUTPUT.PUT_LINE('ID generado: ' || v_id);
END;
/

-- Prueba TXN-1: rollback por email duplicado
DECLARE
    v_id NUMBER;
BEGIN
    SP_REGISTRAR_USUARIO_COMPLETO(
        p_nombre       => 'Email Duplicado',
        p_email        => 'c.torres@gmail.com',   -- ya existe
        p_telefono     => '3001110001',
        p_fnac         => DATE '1990-01-01',
        p_ciudad       => 'Bogota',
        p_id_plan      => 1,
        p_id_referidor => NULL,
        p_metodo_pago  => 'PSE',
        p_id_usuario   => v_id
    );
END;
/

-- Prueba TXN-2
EXEC SP_RENOVACION_MENSUAL(p_batch_size => 10);

-- Prueba TXN-3 (eliminar usuario de prueba)
EXEC SP_ELIMINAR_CUENTA(p_id_usuario => 31, p_confirmacion => 'CONFIRMAR');

-- Prueba TXN-3: sin palabra de confirmación (debe rechazar)
EXEC SP_ELIMINAR_CUENTA(p_id_usuario => 1, p_confirmacion => 'SI');

-- Ver auditoría
SELECT * FROM AUDITORIA_QUINDIOFLIX ORDER BY fecha_evento DESC FETCH FIRST 20 ROWS ONLY;
*/
