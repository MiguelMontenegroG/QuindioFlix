-- =============================================================================
-- QuindioFlix – Entrega 3
-- Archivo 08: USUARIOS Y ROLES  (NT5)
--
-- Núcleo 5 · R.A.1 — Administrar componentes fundamentales
--
-- Contenido:
--   SECCIÓN 1 — PROFILE de recursos (límites de sesión)
--   SECCIÓN 2 — Roles con privilegios diferenciados (4 roles)
--   SECCIÓN 3 — Usuarios Oracle (1 por rol mínimo)
--   SECCIÓN 4 — GRANT de roles y privilegios a usuarios
--   SECCIÓN 5 — Demostración de restricciones (operaciones denegadas)
--
-- IMPORTANTE: este script debe ejecutarse conectado como DBA o con
--             privilegios de CREATE USER, CREATE ROLE, GRANT.
--             Ejemplo: CONNECT system/contraseña@XE
-- =============================================================================

-- =============================================================================
-- SECCIÓN 1: PROFILE DE RECURSOS
-- =============================================================================
-- Propósito: limitar el consumo de recursos de los usuarios de aplicación
-- para proteger la BD ante sesiones zombi, ataques de fuerza bruta y
-- uso excesivo de CPU.
--
-- Oracle aplica los PROFILE solo si el parámetro de instancia está activo:
--   ALTER SYSTEM SET RESOURCE_LIMIT = TRUE SCOPE = BOTH;
-- =============================================================================

-- Activar límite de recursos (requiere DBA)
ALTER SYSTEM SET RESOURCE_LIMIT = TRUE SCOPE = BOTH;

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILE para usuarios de aplicación (analistas, soporte, contenido)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE PROFILE PROF_APLICACION LIMIT
    -- Seguridad de contraseña
    FAILED_LOGIN_ATTEMPTS      5          -- bloquea tras 5 intentos fallidos
    PASSWORD_LOCK_TIME         1/24       -- bloqueo por 1 hora (1/24 de día)
    PASSWORD_LIFE_TIME         90         -- obliga a cambiar contraseña cada 90 días
    PASSWORD_REUSE_TIME        365        -- no puede reusar una contraseña por 1 año
    PASSWORD_REUSE_MAX         6          -- no puede reusar ninguna de las últimas 6
    PASSWORD_GRACE_TIME        7          -- 7 días de gracia antes de bloqueo por expiración

    -- Límites de sesión y recursos
    SESSIONS_PER_USER          3          -- máximo 3 sesiones concurrentes por usuario
    IDLE_TIME                  30         -- cierra sesión tras 30 min de inactividad
    CONNECT_TIME               480        -- máximo 8 horas de conexión continua
    CPU_PER_SESSION            UNLIMITED  -- sin límite de CPU por sesión
    CPU_PER_CALL               6000       -- máximo 60 seg de CPU por llamada (6000 centésimas)
    LOGICAL_READS_PER_SESSION  UNLIMITED
    LOGICAL_READS_PER_CALL     100000     -- máximo 100K bloques lógicos por consulta
    PRIVATE_SGA                5M;        -- máximo 5 MB de SGA privada por sesión

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILE para el administrador (más permisivo en recursos, más estricto en seguridad)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE PROFILE PROF_ADMIN LIMIT
    FAILED_LOGIN_ATTEMPTS      3          -- umbral más bajo (cuenta crítica)
    PASSWORD_LOCK_TIME         2/24       -- bloqueo por 2 horas
    PASSWORD_LIFE_TIME         60         -- cambio cada 60 días
    PASSWORD_REUSE_TIME        365
    PASSWORD_REUSE_MAX         8
    PASSWORD_GRACE_TIME        3

    SESSIONS_PER_USER          2          -- administrador: máximo 2 sesiones
    IDLE_TIME                  60
    CONNECT_TIME               UNLIMITED
    CPU_PER_SESSION            UNLIMITED
    CPU_PER_CALL               UNLIMITED
    LOGICAL_READS_PER_SESSION  UNLIMITED
    LOGICAL_READS_PER_CALL     UNLIMITED;

-- Verificar profiles creados
SELECT profile, resource_name, limit
FROM   dba_profiles
WHERE  profile IN ('PROF_APLICACION', 'PROF_ADMIN')
ORDER  BY profile, resource_name;


-- =============================================================================
-- SECCIÓN 2: CREACIÓN DE ROLES
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- ROL_ADMIN — Administrador de la plataforma
-- Puede hacer CRUD en todas las tablas, crear objetos y ejecutar
-- todos los procedimientos del esquema.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE ROLE ROL_ADMIN;

-- Privilegios de objeto: CRUD en todas las tablas del esquema
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.PLANES           TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.CATEGORIAS        TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.GENEROS           TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.DEPARTAMENTOS     TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.EMPLEADOS         TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.CONTENIDO         TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.CONTENIDO_GENERO  TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.CONTENIDO_RELACIONADO TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.TEMPORADAS        TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.EPISODIOS         TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.USUARIOS          TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.PERFILES          TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.PAGOS             TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.REPRODUCCIONES    TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.CALIFICACIONES    TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.FAVORITOS         TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.REPORTES          TO ROL_ADMIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.AUDITORIA_QUINDIOFLIX TO ROL_ADMIN;

-- Privilegios en secuencias
GRANT SELECT ON QUINDIOFLIX.SEQ_USUARIOS       TO ROL_ADMIN;
GRANT SELECT ON QUINDIOFLIX.SEQ_PERFILES        TO ROL_ADMIN;
GRANT SELECT ON QUINDIOFLIX.SEQ_PAGOS           TO ROL_ADMIN;
GRANT SELECT ON QUINDIOFLIX.SEQ_REPRODUCCIONES  TO ROL_ADMIN;
GRANT SELECT ON QUINDIOFLIX.SEQ_CALIFICACIONES  TO ROL_ADMIN;
GRANT SELECT ON QUINDIOFLIX.SEQ_REPORTES        TO ROL_ADMIN;
GRANT SELECT ON QUINDIOFLIX.SEQ_CONTENIDO       TO ROL_ADMIN;
GRANT SELECT ON QUINDIOFLIX.SEQ_TEMPORADAS      TO ROL_ADMIN;
GRANT SELECT ON QUINDIOFLIX.SEQ_EPISODIOS       TO ROL_ADMIN;

-- Ejecución de todos los procedimientos y funciones
GRANT EXECUTE ON QUINDIOFLIX.SP_REGISTRAR_USUARIO_COMPLETO TO ROL_ADMIN;
GRANT EXECUTE ON QUINDIOFLIX.SP_RENOVACION_MENSUAL          TO ROL_ADMIN;
GRANT EXECUTE ON QUINDIOFLIX.SP_ELIMINAR_CUENTA             TO ROL_ADMIN;
GRANT EXECUTE ON QUINDIOFLIX.SP_CAMBIAR_PLAN                TO ROL_ADMIN;
GRANT EXECUTE ON QUINDIOFLIX.SP_REPORTE_CONSUMO             TO ROL_ADMIN;
GRANT EXECUTE ON QUINDIOFLIX.FN_CALCULAR_MONTO              TO ROL_ADMIN;
GRANT EXECUTE ON QUINDIOFLIX.FN_CONTENIDO_RECOMENDADO       TO ROL_ADMIN;
GRANT EXECUTE ON QUINDIOFLIX.PKG_EXCEPCIONES                TO ROL_ADMIN;


-- ─────────────────────────────────────────────────────────────────────────────
-- ROL_ANALISTA — Analista de datos / gerencia
-- Solo lectura en todas las tablas + ejecución de procedimientos de reporte.
-- No puede modificar datos.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE ROLE ROL_ANALISTA;

GRANT SELECT ON QUINDIOFLIX.PLANES                  TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.CATEGORIAS              TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.GENEROS                 TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.DEPARTAMENTOS           TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.EMPLEADOS               TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.CONTENIDO               TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.CONTENIDO_GENERO        TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.CONTENIDO_RELACIONADO   TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.TEMPORADAS              TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.EPISODIOS               TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.USUARIOS                TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.PERFILES                TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.PAGOS                   TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.REPRODUCCIONES          TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.CALIFICACIONES          TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.FAVORITOS               TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.REPORTES                TO ROL_ANALISTA;
GRANT SELECT ON QUINDIOFLIX.AUDITORIA_QUINDIOFLIX   TO ROL_ANALISTA;

-- Solo procedimientos de lectura / reporte
GRANT EXECUTE ON QUINDIOFLIX.SP_REPORTE_CONSUMO     TO ROL_ANALISTA;
GRANT EXECUTE ON QUINDIOFLIX.FN_CALCULAR_MONTO       TO ROL_ANALISTA;
GRANT EXECUTE ON QUINDIOFLIX.FN_CONTENIDO_RECOMENDADO TO ROL_ANALISTA;
GRANT EXECUTE ON QUINDIOFLIX.PKG_EXCEPCIONES         TO ROL_ANALISTA;


-- ─────────────────────────────────────────────────────────────────────────────
-- ROL_SOPORTE — Agente de soporte al cliente
-- Puede ver datos de usuario y gestionar pagos.
-- No puede ver contenido editorial ni auditoría interna.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE ROLE ROL_SOPORTE;

-- Solo las tablas necesarias para atender al cliente
GRANT SELECT         ON QUINDIOFLIX.USUARIOS       TO ROL_SOPORTE;
GRANT SELECT         ON QUINDIOFLIX.PERFILES        TO ROL_SOPORTE;
GRANT SELECT         ON QUINDIOFLIX.PLANES          TO ROL_SOPORTE;
GRANT SELECT, INSERT, UPDATE
                     ON QUINDIOFLIX.PAGOS           TO ROL_SOPORTE;
GRANT SELECT         ON QUINDIOFLIX.REPRODUCCIONES  TO ROL_SOPORTE;
GRANT SELECT         ON QUINDIOFLIX.REPORTES        TO ROL_SOPORTE;

-- Secuencia de pagos para poder insertar
GRANT SELECT ON QUINDIOFLIX.SEQ_PAGOS               TO ROL_SOPORTE;

-- Puede cambiar plan de un usuario (procedimiento acotado)
GRANT EXECUTE ON QUINDIOFLIX.SP_CAMBIAR_PLAN        TO ROL_SOPORTE;
GRANT EXECUTE ON QUINDIOFLIX.FN_CALCULAR_MONTO      TO ROL_SOPORTE;
GRANT EXECUTE ON QUINDIOFLIX.PKG_EXCEPCIONES        TO ROL_SOPORTE;


-- ─────────────────────────────────────────────────────────────────────────────
-- ROL_CONTENIDO — Gestor del catálogo editorial
-- Puede administrar todo el catálogo (CONTENIDO, TEMPORADAS, EPISODIOS, GENEROS)
-- y ver métricas de consumo. No puede ver datos financieros ni de usuario.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE ROLE ROL_CONTENIDO;

GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.CONTENIDO           TO ROL_CONTENIDO;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.CONTENIDO_GENERO    TO ROL_CONTENIDO;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.CONTENIDO_RELACIONADO TO ROL_CONTENIDO;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.TEMPORADAS          TO ROL_CONTENIDO;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.EPISODIOS           TO ROL_CONTENIDO;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.GENEROS             TO ROL_CONTENIDO;
GRANT SELECT, INSERT, UPDATE, DELETE ON QUINDIOFLIX.CATEGORIAS          TO ROL_CONTENIDO;

-- Solo lectura en métricas de consumo
GRANT SELECT ON QUINDIOFLIX.REPRODUCCIONES   TO ROL_CONTENIDO;
GRANT SELECT ON QUINDIOFLIX.CALIFICACIONES   TO ROL_CONTENIDO;
GRANT SELECT ON QUINDIOFLIX.FAVORITOS        TO ROL_CONTENIDO;
GRANT SELECT ON QUINDIOFLIX.REPORTES         TO ROL_CONTENIDO;

-- Secuencias editoriales
GRANT SELECT ON QUINDIOFLIX.SEQ_CONTENIDO    TO ROL_CONTENIDO;
GRANT SELECT ON QUINDIOFLIX.SEQ_TEMPORADAS   TO ROL_CONTENIDO;
GRANT SELECT ON QUINDIOFLIX.SEQ_EPISODIOS    TO ROL_CONTENIDO;

GRANT EXECUTE ON QUINDIOFLIX.PKG_EXCEPCIONES TO ROL_CONTENIDO;

-- Verificar roles creados
SELECT role FROM dba_roles
WHERE  role IN ('ROL_ADMIN','ROL_ANALISTA','ROL_SOPORTE','ROL_CONTENIDO')
ORDER  BY role;


-- =============================================================================
-- SECCIÓN 3: CREACIÓN DE USUARIOS ORACLE
-- =============================================================================
-- Convención de contraseñas: QuindioFlix_<Rol>_2024#
-- En producción usar Oracle Wallet o contraseñas gestionadas por bóveda.
-- =============================================================================

-- ── Usuario Administrador ───────────────────────────────────────────────────
CREATE USER qf_admin
    IDENTIFIED BY "QuindioFlix_Admin_2024#"
    DEFAULT   TABLESPACE users
    TEMPORARY TABLESPACE temp
    PROFILE   PROF_ADMIN
    ACCOUNT   UNLOCK;

-- ── Usuario Analista de datos ────────────────────────────────────────────────
CREATE USER qf_analista
    IDENTIFIED BY "QuindioFlix_Analista_2024#"
    DEFAULT   TABLESPACE users
    TEMPORARY TABLESPACE temp
    PROFILE   PROF_APLICACION
    ACCOUNT   UNLOCK;

-- ── Usuario Soporte al cliente ────────────────────────────────────────────────
CREATE USER qf_soporte
    IDENTIFIED BY "QuindioFlix_Soporte_2024#"
    DEFAULT   TABLESPACE users
    TEMPORARY TABLESPACE temp
    PROFILE   PROF_APLICACION
    ACCOUNT   UNLOCK;

-- ── Usuario Gestor de contenido ───────────────────────────────────────────────
CREATE USER qf_contenido
    IDENTIFIED BY "QuindioFlix_Contenido_2024#"
    DEFAULT   TABLESPACE users
    TEMPORARY TABLESPACE temp
    PROFILE   PROF_APLICACION
    ACCOUNT   UNLOCK;

-- Verificar usuarios creados
SELECT username, account_status, profile, default_tablespace
FROM   dba_users
WHERE  username IN ('QF_ADMIN','QF_ANALISTA','QF_SOPORTE','QF_CONTENIDO')
ORDER  BY username;


-- =============================================================================
-- SECCIÓN 4: ASIGNACIÓN DE ROLES Y PRIVILEGIOS DE SISTEMA
-- =============================================================================

-- ── qf_admin ─────────────────────────────────────────────────────────────────
GRANT ROL_ADMIN           TO qf_admin;
GRANT CREATE SESSION      TO qf_admin;   -- puede conectarse
GRANT CREATE TABLE        TO qf_admin;   -- puede crear objetos temporales
GRANT CREATE VIEW         TO qf_admin;
GRANT CREATE PROCEDURE    TO qf_admin;
GRANT CREATE SEQUENCE     TO qf_admin;

-- ── qf_analista ───────────────────────────────────────────────────────────────
GRANT ROL_ANALISTA        TO qf_analista;
GRANT CREATE SESSION      TO qf_analista;

-- ── qf_soporte ───────────────────────────────────────────────────────────────
GRANT ROL_SOPORTE         TO qf_soporte;
GRANT CREATE SESSION      TO qf_soporte;

-- ── qf_contenido ─────────────────────────────────────────────────────────────
GRANT ROL_CONTENIDO       TO qf_contenido;
GRANT CREATE SESSION      TO qf_contenido;

-- Verificar asignación de roles
SELECT grantee, granted_role, admin_option, default_role
FROM   dba_role_privs
WHERE  grantee IN ('QF_ADMIN','QF_ANALISTA','QF_SOPORTE','QF_CONTENIDO')
ORDER  BY grantee;

-- Verificar privilegios de objeto heredados por rol
SELECT rp.grantee   AS usuario,
       rp.granted_role,
       tp.table_name,
       tp.privilege,
       tp.grantable
FROM   dba_role_privs  rp
JOIN   dba_tab_privs   tp ON tp.grantee = rp.granted_role
WHERE  rp.grantee IN ('QF_ADMIN','QF_ANALISTA','QF_SOPORTE','QF_CONTENIDO')
ORDER  BY rp.grantee, tp.table_name, tp.privilege;


-- =============================================================================
-- SECCIÓN 5: DEMOSTRACIÓN DE RESTRICCIONES
-- =============================================================================
-- Estos bloques deben ejecutarse CONECTADO COMO EL USUARIO CORRESPONDIENTE.
-- Instrucciones:
--   CONNECT qf_analista/"QuindioFlix_Analista_2024#"@XE
--   (luego ejecutar el bloque de prueba de QF_ANALISTA)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PRUEBA 1: QF_ANALISTA — Intenta INSERT en USUARIOS (debe fallar)
-- Conectar como: qf_analista
-- ─────────────────────────────────────────────────────────────────────────────
/*
CONNECT qf_analista/"QuindioFlix_Analista_2024#"@XE

-- Operación PERMITIDA: SELECT en cualquier tabla
SELECT COUNT(*) FROM QUINDIOFLIX.USUARIOS;
-- Resultado esperado: 30  ✔

SELECT COUNT(*) FROM QUINDIOFLIX.PAGOS;
-- Resultado esperado: 80  ✔

-- Operación DENEGADA: INSERT en USUARIOS
INSERT INTO QUINDIOFLIX.USUARIOS (
    id_usuario, nombre, email, telefono,
    fecha_nacimiento, ciudad, id_plan
) VALUES (
    99, 'Prueba Analista', 'p.analista@test.com',
    '3000000000', DATE '1990-01-01', 'Bogota', 1
);
-- Resultado esperado: ORA-01031: insufficient privileges  ✖

-- Operación DENEGADA: DELETE en PAGOS
DELETE FROM QUINDIOFLIX.PAGOS WHERE id_pago = 1;
-- Resultado esperado: ORA-01031: insufficient privileges  ✖

-- Operación PERMITIDA: ejecutar SP_REPORTE_CONSUMO
SET SERVEROUTPUT ON;
EXEC QUINDIOFLIX.SP_REPORTE_CONSUMO(p_id_usuario => 1);
-- Resultado esperado: reporte impreso en SERVEROUTPUT  ✔

-- Operación DENEGADA: ejecutar SP_ELIMINAR_CUENTA (no tiene EXECUTE)
EXEC QUINDIOFLIX.SP_ELIMINAR_CUENTA(p_id_usuario => 30, p_confirmacion => 'CONFIRMAR');
-- Resultado esperado: ORA-00904 o ORA-01031  ✖
*/


-- ─────────────────────────────────────────────────────────────────────────────
-- PRUEBA 2: QF_SOPORTE — Intenta SELECT en CONTENIDO (debe fallar)
-- Conectar como: qf_soporte
-- ─────────────────────────────────────────────────────────────────────────────
/*
CONNECT qf_soporte/"QuindioFlix_Soporte_2024#"@XE

-- Operación PERMITIDA: ver datos de usuario y pagos
SELECT id_usuario, nombre, estado_cuenta FROM QUINDIOFLIX.USUARIOS WHERE id_usuario = 5;
-- Resultado esperado: fila del usuario 5  ✔

SELECT id_pago, monto, estado_pago FROM QUINDIOFLIX.PAGOS WHERE id_usuario = 5;
-- Resultado esperado: pagos del usuario 5  ✔

-- Operación PERMITIDA: insertar un pago manual (ej. ajuste de soporte)
INSERT INTO QUINDIOFLIX.PAGOS (
    id_pago, id_usuario, fecha_pago, monto,
    metodo_pago, estado_pago, fecha_vencimiento
) VALUES (
    QUINDIOFLIX.SEQ_PAGOS.NEXTVAL,
    5, SYSDATE, 34900,
    'PSE', 'EXITOSO', ADD_MONTHS(SYSDATE, 1)
);
COMMIT;
-- Resultado esperado: 1 row inserted  ✔

-- Operación PERMITIDA: cambiar plan de un usuario
SET SERVEROUTPUT ON;
EXEC QUINDIOFLIX.SP_CAMBIAR_PLAN(p_id_usuario => 5, p_id_plan_nuevo => 2, p_metodo_pago => 'PSE');
-- Resultado esperado: mensaje de cambio exitoso  ✔

-- Operación DENEGADA: ver tabla CONTENIDO
SELECT id_contenido, titulo FROM QUINDIOFLIX.CONTENIDO WHERE ROWNUM <= 5;
-- Resultado esperado: ORA-00942: table or view does not exist  ✖

-- Operación DENEGADA: ver tabla AUDITORIA_QUINDIOFLIX
SELECT * FROM QUINDIOFLIX.AUDITORIA_QUINDIOFLIX WHERE ROWNUM <= 5;
-- Resultado esperado: ORA-00942  ✖

-- Operación DENEGADA: eliminar un usuario
EXEC QUINDIOFLIX.SP_ELIMINAR_CUENTA(p_id_usuario => 30, p_confirmacion => 'CONFIRMAR');
-- Resultado esperado: ORA-01031  ✖
*/


-- ─────────────────────────────────────────────────────────────────────────────
-- PRUEBA 3: QF_CONTENIDO — Intenta ver PAGOS (debe fallar)
-- Conectar como: qf_contenido
-- ─────────────────────────────────────────────────────────────────────────────
/*
CONNECT qf_contenido/"QuindioFlix_Contenido_2024#"@XE

-- Operación PERMITIDA: gestionar catálogo
INSERT INTO QUINDIOFLIX.CONTENIDO (
    id_contenido, titulo, anio_lanzamiento, duracion,
    clasificacion_edad, fecha_agregado, es_original,
    id_categoria, id_empleado_resp
) VALUES (
    41, 'Prueba Contenido Test', 2024, 5400,
    '+13', SYSDATE, 'S', 1, 4
);
COMMIT;
-- Resultado esperado: 1 row inserted  ✔

-- Operación PERMITIDA: ver calificaciones de un contenido
SELECT id_calificacion, estrellas, resenia
FROM   QUINDIOFLIX.CALIFICACIONES
WHERE  id_contenido = 6;
-- Resultado esperado: filas con calificaciones del contenido 6  ✔

-- Operación DENEGADA: ver PAGOS
SELECT * FROM QUINDIOFLIX.PAGOS WHERE ROWNUM <= 5;
-- Resultado esperado: ORA-00942  ✖

-- Operación DENEGADA: ver USUARIOS
SELECT id_usuario, nombre, email FROM QUINDIOFLIX.USUARIOS WHERE ROWNUM <= 5;
-- Resultado esperado: ORA-00942  ✖

-- Operación DENEGADA: cambiar plan de usuario
EXEC QUINDIOFLIX.SP_CAMBIAR_PLAN(p_id_usuario => 1, p_id_plan_nuevo => 1, p_metodo_pago => 'PSE');
-- Resultado esperado: ORA-01031  ✖
*/


-- ─────────────────────────────────────────────────────────────────────────────
-- PRUEBA 4: QF_ADMIN — Debe poder hacer todo
-- Conectar como: qf_admin
-- ─────────────────────────────────────────────────────────────────────────────
/*
CONNECT qf_admin/"QuindioFlix_Admin_2024#"@XE
SET SERVEROUTPUT ON;

-- Operación PERMITIDA: SELECT en cualquier tabla
SELECT COUNT(*) FROM QUINDIOFLIX.USUARIOS;          -- 30  ✔
SELECT COUNT(*) FROM QUINDIOFLIX.PAGOS;             -- 80  ✔
SELECT COUNT(*) FROM QUINDIOFLIX.REPRODUCCIONES;    -- 200 ✔
SELECT COUNT(*) FROM QUINDIOFLIX.AUDITORIA_QUINDIOFLIX; -- registros ✔

-- Operación PERMITIDA: DELETE
DELETE FROM QUINDIOFLIX.AUDITORIA_QUINDIOFLIX WHERE ROWNUM <= 1;
ROLLBACK;   -- revertir para no alterar datos de prueba
-- Resultado esperado: 1 row deleted (luego rollback)  ✔

-- Operación PERMITIDA: ejecutar cualquier procedimiento
EXEC QUINDIOFLIX.SP_RENOVACION_MENSUAL(p_batch_size => 100);
-- Resultado esperado: proceso de renovación completado  ✔
*/


-- ─────────────────────────────────────────────────────────────────────────────
-- PRUEBA 5: Verificar límite de sesiones (PROF_APLICACION: SESSIONS_PER_USER=3)
-- ─────────────────────────────────────────────────────────────────────────────
/*
-- Abrir 4 ventanas de SQL Developer como qf_analista.
-- Las primeras 3 se conectarán sin problema.
-- La 4ta conexión recibirá:
--   ORA-02391: exceeded simultaneous SESSIONS_PER_USER limit
*/


-- =============================================================================
-- SECCIÓN 6: CONSULTAS DE VERIFICACIÓN (ejecutar como DBA)
-- =============================================================================

-- Resumen de privilegios por usuario
SELECT  u.username,
        u.account_status,
        u.profile,
        rp.granted_role,
        u.default_tablespace
FROM    dba_users      u
LEFT JOIN dba_role_privs rp ON rp.grantee = u.username
WHERE   u.username IN ('QF_ADMIN','QF_ANALISTA','QF_SOPORTE','QF_CONTENIDO')
ORDER   BY u.username, rp.granted_role;

-- Detalle de privilegios de sistema por usuario
SELECT  grantee, privilege, admin_option
FROM    dba_sys_privs
WHERE   grantee IN ('QF_ADMIN','QF_ANALISTA','QF_SOPORTE','QF_CONTENIDO')
ORDER   BY grantee, privilege;

-- Detalle completo de privilegios sobre objetos (heredados del rol)
SELECT  rp.grantee                    AS usuario,
        rp.granted_role               AS rol,
        tp.owner || '.' || tp.table_name AS objeto,
        tp.privilege
FROM    dba_role_privs  rp
JOIN    dba_tab_privs   tp ON tp.grantee = rp.granted_role
WHERE   rp.grantee IN ('QF_ADMIN','QF_ANALISTA','QF_SOPORTE','QF_CONTENIDO')
AND     tp.owner = 'QUINDIOFLIX'
ORDER   BY rp.grantee, tp.table_name, tp.privilege;

-- Configuración de perfiles
SELECT  profile,
        resource_name,
        resource_type,
        limit
FROM    dba_profiles
WHERE   profile IN ('PROF_ADMIN','PROF_APLICACION')
ORDER   BY profile, resource_name;

-- Sesiones activas de los usuarios de aplicación (monitoreo)
SELECT  s.username,
        s.sid,
        s.serial#,
        s.status,
        s.logon_time,
        s.last_call_et AS segundos_inactivo,
        s.program
FROM    v$session s
WHERE   s.username IN ('QF_ADMIN','QF_ANALISTA','QF_SOPORTE','QF_CONTENIDO')
ORDER   BY s.username, s.logon_time;


-- =============================================================================
-- REVOCACIÓN (rollback de seguridad — ejecutar si se desea limpiar)
-- =============================================================================
/*
-- Revocar roles
REVOKE ROL_ADMIN     FROM qf_admin;
REVOKE ROL_ANALISTA  FROM qf_analista;
REVOKE ROL_SOPORTE   FROM qf_soporte;
REVOKE ROL_CONTENIDO FROM qf_contenido;

-- Eliminar usuarios
DROP USER qf_admin      CASCADE;
DROP USER qf_analista   CASCADE;
DROP USER qf_soporte    CASCADE;
DROP USER qf_contenido  CASCADE;

-- Eliminar roles
DROP ROLE ROL_ADMIN;
DROP ROLE ROL_ANALISTA;
DROP ROLE ROL_SOPORTE;
DROP ROLE ROL_CONTENIDO;

-- Eliminar profiles
DROP PROFILE PROF_ADMIN       CASCADE;
DROP PROFILE PROF_APLICACION  CASCADE;
*/
