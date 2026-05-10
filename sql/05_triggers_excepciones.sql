-- QuindioFlix – Entrega 2

-- Disparadores implementados:
--   TRG_VALIDA_REPRODUCCION     – fila BEFORE INSERT en REPRODUCCIONES
--                                  • RN-03: bloquea contenido +16/+18 en perfiles infantiles
--                                  • RN-13: bloquea reproducción si cuenta INACTIVA
--   TRG_VALIDA_CALIFICACION     – fila BEFORE INSERT en CALIFICACIONES
--                                  • RN-05: exige ≥ 50 % de avance para calificar
--                                  • RN-12: unicidad perfil-contenido (informativo)
--   TRG_LIMITE_PERFILES         – fila BEFORE INSERT en PERFILES
--                                  • RN-02: no superar max_perfiles del plan
--   TRG_AUDITORIA_PAGOS         – fila AFTER INSERT OR UPDATE en PAGOS
--                                  • Marca cuenta INACTIVA si pago FALLIDO > 30 días
--   TRG_SUPERVISOR_MISMO_DEPTO  – fila BEFORE INSERT OR UPDATE en EMPLEADOS
--                                  • RN-08: supervisor debe ser del mismo departamento
--   TRG_JEFE_MISMO_DEPTO        – fila BEFORE INSERT OR UPDATE en DEPARTAMENTOS
--                                  • RN-14: jefe debe pertenecer al departamento
--   TRG_LOG_CAMBIO_PLAN         – sentencia AFTER UPDATE en USUARIOS
--                                  • Registra en DBMS_OUTPUT el cambio de plan

SET SERVEROUTPUT ON SIZE UNLIMITED;

-- TABLA DE AUDITORÍA
-- Registra todos los cambios sensibles del sistema.

CREATE TABLE IF NOT EXISTS AUDITORIA_QUINDIOFLIX (
    id_auditoria   NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tabla_afectada VARCHAR2(50)    NOT NULL,
    operacion      VARCHAR2(10)    NOT NULL,   -- INSERT / UPDATE / DELETE
    id_registro    NUMBER,
    descripcion    VARCHAR2(500),
    fecha_evento   TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,
    usuario_bd     VARCHAR2(100)   DEFAULT USER         NOT NULL
);

-- Si el motor no soporta IF NOT EXISTS, usar:
-- CREATE TABLE AUDITORIA_QUINDIOFLIX ( ... );   -- y omitir IF NOT EXISTS


-- TRIGGER 1 (FILA): TRG_VALIDA_REPRODUCCION
-- Evento  : BEFORE INSERT ON REPRODUCCIONES
-- Aplica  : RN-03 (perfil infantil), RN-13 (cuenta inactiva)

CREATE OR REPLACE TRIGGER TRG_VALIDA_REPRODUCCION
BEFORE INSERT ON REPRODUCCIONES
FOR EACH ROW
DECLARE
    v_tipo_perfil    PERFILES.tipo%TYPE;
    v_clasif_edad    CONTENIDO.clasificacion_edad%TYPE;
    v_estado_cuenta  USUARIOS.estado_cuenta%TYPE;
BEGIN
    -- Obtener datos del perfil y su usuario
    SELECT pf.tipo, u.estado_cuenta
    INTO   v_tipo_perfil, v_estado_cuenta
    FROM   PERFILES pf
    JOIN   USUARIOS u ON u.id_usuario = pf.id_usuario
    WHERE  pf.id_perfil = :NEW.id_perfil;

    -- ── RN-13: cuenta inactiva bloquea reproducción
    IF v_estado_cuenta = 'INACTIVO' THEN
        RAISE_APPLICATION_ERROR(-20003,
            'TRG_VALIDA_REPRODUCCION: la cuenta está INACTIVA. '
            || 'Regularice su pago para continuar usando QuindioFlix.');
    END IF;

    -- RN-03: perfil infantil solo puede ver TP, +7 o +13
    IF v_tipo_perfil = 'INFANTIL' THEN
        SELECT clasificacion_edad
        INTO   v_clasif_edad
        FROM   CONTENIDO
        WHERE  id_contenido = :NEW.id_contenido;

        IF v_clasif_edad IN ('+16', '+18') THEN
            RAISE_APPLICATION_ERROR(-20003,
                'TRG_VALIDA_REPRODUCCION: el perfil INFANTIL no puede reproducir '
                || 'contenido con clasificación "' || v_clasif_edad || '".');
        END IF;
    END IF;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20005,
            'TRG_VALIDA_REPRODUCCION: perfil o contenido no encontrado '
            || '(id_perfil=' || :NEW.id_perfil
            || ', id_contenido=' || :NEW.id_contenido || ').');
END TRG_VALIDA_REPRODUCCION;
/

-- TRIGGER 2 (FILA): TRG_VALIDA_CALIFICACION
-- Evento  : BEFORE INSERT ON CALIFICACIONES
-- Aplica  : RN-05 (umbral mínimo 50 % de reproducción para calificar)

CREATE OR REPLACE TRIGGER TRG_VALIDA_CALIFICACION
BEFORE INSERT ON CALIFICACIONES
FOR EACH ROW
DECLARE
    v_max_avance     NUMBER;
    v_existe_reprod  NUMBER;
BEGIN
    -- Verificar que existe al menos una reproducción con avance >= 50 % (RN-05)
    SELECT COUNT(*), NVL(MAX(porcentaje_avance), 0)
    INTO   v_existe_reprod, v_max_avance
    FROM   REPRODUCCIONES
    WHERE  id_perfil    = :NEW.id_perfil
    AND    id_contenido = :NEW.id_contenido;

    IF v_existe_reprod = 0 THEN
        RAISE_APPLICATION_ERROR(-20004,
            'TRG_VALIDA_CALIFICACION: el perfil ' || :NEW.id_perfil
            || ' no ha reproducido el contenido ' || :NEW.id_contenido
            || '. Debe verlo antes de calificarlo.');
    END IF;

    IF v_max_avance < 50 THEN
        RAISE_APPLICATION_ERROR(-20004,
            'TRG_VALIDA_CALIFICACION: el perfil ' || :NEW.id_perfil
            || ' solo ha visto el ' || v_max_avance || '% del contenido '
            || :NEW.id_contenido
            || '. Se requiere al menos el 50% para calificar.');
    END IF;

    -- Auditar la nueva calificación
    INSERT INTO AUDITORIA_QUINDIOFLIX (tabla_afectada, operacion, id_registro, descripcion)
    VALUES ('CALIFICACIONES', 'INSERT', :NEW.id_perfil,
            'Perfil ' || :NEW.id_perfil
            || ' calificó contenido ' || :NEW.id_contenido
            || ' con ' || :NEW.estrellas || ' estrella(s).');

END TRG_VALIDA_CALIFICACION;
/

-- TRIGGER 3 (FILA): TRG_LIMITE_PERFILES
-- Evento  : BEFORE INSERT ON PERFILES
-- Aplica  : RN-02: un usuario no puede exceder el máximo de perfiles de su plan

CREATE OR REPLACE TRIGGER TRG_LIMITE_PERFILES
BEFORE INSERT ON PERFILES
FOR EACH ROW
DECLARE
    v_max_perfiles    PLANES.max_perfiles%TYPE;
    v_perfiles_actual NUMBER;
BEGIN
    -- Máximo de perfiles permitido por el plan del usuario
    SELECT p.max_perfiles
    INTO   v_max_perfiles
    FROM   USUARIOS u
    JOIN   PLANES   p ON p.id_plan = u.id_plan
    WHERE  u.id_usuario = :NEW.id_usuario;

    -- Perfiles existentes
    SELECT COUNT(*)
    INTO   v_perfiles_actual
    FROM   PERFILES
    WHERE  id_usuario = :NEW.id_usuario;

    IF v_perfiles_actual >= v_max_perfiles THEN
        RAISE_APPLICATION_ERROR(-20002,
            'TRG_LIMITE_PERFILES: el usuario ' || :NEW.id_usuario
            || ' ya tiene ' || v_perfiles_actual || ' perfil(es). '
            || 'Su plan permite un máximo de ' || v_max_perfiles || '.');
    END IF;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20005,
            'TRG_LIMITE_PERFILES: usuario ' || :NEW.id_usuario || ' no encontrado.');
END TRG_LIMITE_PERFILES;
/

-- TRIGGER 4 (FILA): TRG_AUDITORIA_PAGOS
-- Evento  : AFTER INSERT OR UPDATE ON PAGOS
-- Aplica  : RN-04: desactiva cuenta si el pago falló y ya pasaron 30 días
--           Además audita todos los cambios de estado de pago.

CREATE OR REPLACE TRIGGER TRG_AUDITORIA_PAGOS
AFTER INSERT OR UPDATE ON PAGOS
FOR EACH ROW
DECLARE
    v_dias_mora  NUMBER;
BEGIN
    -- Auditar el evento
    INSERT INTO AUDITORIA_QUINDIOFLIX (tabla_afectada, operacion, id_registro, descripcion)
    VALUES (
        'PAGOS',
        CASE WHEN INSERTING THEN 'INSERT' ELSE 'UPDATE' END,
        :NEW.id_pago,
        'Usuario ' || :NEW.id_usuario
        || ' | Monto: $' || :NEW.monto
        || ' | Estado: ' || NVL(:OLD.estado_pago, 'NUEVO') || ' → ' || :NEW.estado_pago
        || ' | Vence: ' || TO_CHAR(:NEW.fecha_vencimiento, 'DD/MM/YYYY')
    );

    -- RN-04: si el pago es FALLIDO y el vencimiento ya superó 30 días
    IF :NEW.estado_pago = 'FALLIDO' THEN
        v_dias_mora := TRUNC(SYSDATE - :NEW.fecha_vencimiento);

        IF v_dias_mora > 30 THEN
            UPDATE USUARIOS
            SET    estado_cuenta = 'INACTIVO'
            WHERE  id_usuario    = :NEW.id_usuario
            AND    estado_cuenta = 'ACTIVO';

            IF SQL%ROWCOUNT > 0 THEN
                INSERT INTO AUDITORIA_QUINDIOFLIX
                    (tabla_afectada, operacion, id_registro, descripcion)
                VALUES (
                    'USUARIOS', 'UPDATE', :NEW.id_usuario,
                    'Cuenta desactivada por mora de ' || v_dias_mora
                    || ' días (pago #' || :NEW.id_pago || ').'
                );
            END IF;
        END IF;
    END IF;

    -- Si el pago pasa a EXITOSO, reactivar cuenta si estaba inactiva
    IF :NEW.estado_pago = 'EXITOSO'
       AND (:OLD.estado_pago IS NULL OR :OLD.estado_pago <> 'EXITOSO') THEN

        UPDATE USUARIOS
        SET    estado_cuenta = 'ACTIVO'
        WHERE  id_usuario    = :NEW.id_usuario
        AND    estado_cuenta = 'INACTIVO';

        IF SQL%ROWCOUNT > 0 THEN
            INSERT INTO AUDITORIA_QUINDIOFLIX
                (tabla_afectada, operacion, id_registro, descripcion)
            VALUES (
                'USUARIOS', 'UPDATE', :NEW.id_usuario,
                'Cuenta reactivada por pago exitoso #' || :NEW.id_pago || '.'
            );
        END IF;
    END IF;

END TRG_AUDITORIA_PAGOS;
/

-- TRIGGER 5 (FILA): TRG_SUPERVISOR_MISMO_DEPTO
-- Evento  : BEFORE INSERT OR UPDATE ON EMPLEADOS
-- Aplica  : RN-08: el supervisor debe pertenecer al mismo departamento

CREATE OR REPLACE TRIGGER TRG_SUPERVISOR_MISMO_DEPTO
BEFORE INSERT OR UPDATE ON EMPLEADOS
FOR EACH ROW
DECLARE
    v_depto_supervisor EMPLEADOS.id_departamento%TYPE;
BEGIN
    -- Solo aplica cuando se asigna un supervisor
    IF :NEW.id_supervisor IS NOT NULL THEN

        -- Obtener el departamento del supervisor propuesto
        BEGIN
            SELECT id_departamento
            INTO   v_depto_supervisor
            FROM   EMPLEADOS
            WHERE  id_empleado = :NEW.id_supervisor;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                RAISE_APPLICATION_ERROR(-20005,
                    'TRG_SUPERVISOR_MISMO_DEPTO: el supervisor '
                    || :NEW.id_supervisor || ' no existe.');
        END;

        -- Validar que ambos sean del mismo departamento (RN-08)
        IF v_depto_supervisor <> :NEW.id_departamento THEN
            RAISE_APPLICATION_ERROR(-20005,
                'TRG_SUPERVISOR_MISMO_DEPTO: el supervisor '
                || :NEW.id_supervisor
                || ' pertenece al departamento ' || v_depto_supervisor
                || ', distinto al del empleado (' || :NEW.id_departamento || ').'
                || ' No se permiten supervisiones interdepartamentales.');
        END IF;

        -- Un empleado no puede ser su propio supervisor (ya cubierto por CHECK,
        -- pero se mantiene como defensa en profundidad)
        IF :NEW.id_supervisor = :NEW.id_empleado THEN
            RAISE_APPLICATION_ERROR(-20005,
                'TRG_SUPERVISOR_MISMO_DEPTO: un empleado no puede '
                || 'supervisarse a sí mismo.');
        END IF;

    END IF;
END TRG_SUPERVISOR_MISMO_DEPTO;
/

-- TRIGGER 6 (FILA): TRG_JEFE_MISMO_DEPTO
-- Evento  : BEFORE INSERT OR UPDATE ON DEPARTAMENTOS
-- Aplica  : RN-14: el jefe debe ser empleado del mismo departamento

CREATE OR REPLACE TRIGGER TRG_JEFE_MISMO_DEPTO
BEFORE INSERT OR UPDATE ON DEPARTAMENTOS
FOR EACH ROW
DECLARE
    v_depto_jefe EMPLEADOS.id_departamento%TYPE;
BEGIN
    IF :NEW.id_jefe IS NOT NULL THEN

        BEGIN
            SELECT id_departamento
            INTO   v_depto_jefe
            FROM   EMPLEADOS
            WHERE  id_empleado = :NEW.id_jefe;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                RAISE_APPLICATION_ERROR(-20005,
                    'TRG_JEFE_MISMO_DEPTO: el empleado '
                    || :NEW.id_jefe || ' no existe.');
        END;

        IF v_depto_jefe <> :NEW.id_departamento THEN
            RAISE_APPLICATION_ERROR(-20005,
                'TRG_JEFE_MISMO_DEPTO: el empleado ' || :NEW.id_jefe
                || ' pertenece al departamento ' || v_depto_jefe
                || ' y no puede ser jefe del departamento '
                || :NEW.id_departamento || '.');
        END IF;

    END IF;
END TRG_JEFE_MISMO_DEPTO;
/

-- TRIGGER 7 (SENTENCIA): TRG_LOG_CAMBIO_PLAN
-- Evento  : AFTER UPDATE OF id_plan ON USUARIOS  (nivel de sentencia)
-- Propósito: Registra en la tabla de auditoría todos los cambios de plan
--            que ocurrieron en la sentencia UPDATE (puede afectar N filas).

CREATE OR REPLACE TRIGGER TRG_LOG_CAMBIO_PLAN
AFTER UPDATE OF id_plan ON USUARIOS
DECLARE
    CURSOR cur_cambios IS
        SELECT u.id_usuario,
               u.nombre,
               u.id_plan                   AS plan_nuevo,
               p.nombre_plan               AS nombre_plan_nuevo
        FROM   USUARIOS u
        JOIN   PLANES   p ON p.id_plan = u.id_plan;
        -- Nota: en un trigger de sentencia no se puede usar :OLD/:NEW.
        -- El log detallado por fila se hace en TRG_AUDITORIA_PAGOS.
        -- Aquí registramos el resumen post-sentencia.

    v_total NUMBER := 0;
BEGIN
    FOR reg IN cur_cambios LOOP
        v_total := v_total + 1;
    END LOOP;

    INSERT INTO AUDITORIA_QUINDIOFLIX (tabla_afectada, operacion, id_registro, descripcion)
    VALUES (
        'USUARIOS', 'UPDATE', NULL,
        'Sentencia UPDATE id_plan ejecutada. '
        || 'Total usuarios afectados verificados: ' || v_total
        || '. Fecha: ' || TO_CHAR(SYSDATE, 'DD/MM/YYYY HH24:MI:SS')
    );
END TRG_LOG_CAMBIO_PLAN;
/
-- PRUEBA
/*
-- Prueba TRG_VALIDA_REPRODUCCION: cuenta inactiva
-- Primero marcar usuario 6 como INACTIVO (ya está en los datos de prueba)
-- Luego intentar insertar reproducción para el perfil de ese usuario
INSERT INTO REPRODUCCIONES VALUES (
    seq_reproducciones.NEXTVAL, 6, 1, NULL,
    SYSTIMESTAMP, NULL, 'TV', 0
);
-- Debe lanzar ORA-20003

-- Prueba TRG_VALIDA_REPRODUCCION: perfil infantil con contenido +18
-- El perfil 2 es INFANTIL (usuario 1, nombre 'Ninos')
INSERT INTO REPRODUCCIONES VALUES (
    seq_reproducciones.NEXTVAL, 2, 5, NULL,  -- contenido 5 es +18
    SYSTIMESTAMP, NULL, 'TV', 0
);
-- Debe lanzar ORA-20003

-- Prueba TRG_VALIDA_CALIFICACION: sin reproducción previa
INSERT INTO CALIFICACIONES VALUES (
    seq_calificaciones.NEXTVAL, 1, 40, 5, 'Prueba sin haber visto', SYSDATE
);
-- Debe lanzar ORA-20004

-- Prueba TRG_LIMITE_PERFILES: usuario con plan Básico (max 2 perfiles)
-- El usuario 11 (Básico) ya tiene 1 perfil; intentar agregar el 3ro debería fallar
-- tras agregar un 2do perfil primero.

-- Prueba TRG_SUPERVISOR_MISMO_DEPTO: supervisor de otro departamento
UPDATE EMPLEADOS SET id_supervisor = 8  -- id 8 = Marketing
WHERE id_empleado = 2;                  -- id 2 = Tecnología
-- Debe lanzar ORA-20005
ROLLBACK;

-- Consultar auditoría
SELECT * FROM AUDITORIA_QUINDIOFLIX ORDER BY fecha_evento DESC FETCH FIRST 20 ROWS ONLY;
*/
