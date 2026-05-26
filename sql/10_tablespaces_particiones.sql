-- =============================================================================
-- QuindioFlix -- Tablespaces y Particionamiento
-- Archivo 10: Creacion de tablespaces para REPRODUCCIONES particionada
--
-- Crea dos tablespaces dedicados para la tabla particionada:
--   TS_REPROD_2024 → Datos historicos hasta 2024
--   TS_REPROD_2025 → Datos desde 2025 en adelante
--
-- Luego crea REPRODUCCIONES_PART con particion por rango de FECHA_HORA_INICIO
-- y migra los datos existentes desde REPRODUCCIONES.
--
-- Ejecutar como C##quindioflix (debe tener CREATE TABLESPACE, CREATE TABLE)
-- =============================================================================

WHENEVER SQLERROR CONTINUE;

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET VERIFY OFF;


-- =============================================================================
-- 1. CREACION DE TABLESPACES
-- =============================================================================
-- Cada tablespace de 100 MB con autoextend hasta 500 MB.
-- Se usa WHENEVER SQLERROR CONTINUE para no romper si ya existen.

CREATE TABLESPACE TS_REPROD_2024
    DATAFILE 'ts_reprod_2024.dbf'
    SIZE 100 M
    AUTOEXTEND ON NEXT 50 M MAXSIZE 500 M
    EXTENT MANAGEMENT LOCAL AUTOALLOCATE
    SEGMENT SPACE MANAGEMENT AUTO;

CREATE TABLESPACE TS_REPROD_2025
    DATAFILE 'ts_reprod_2025.dbf'
    SIZE 100 M
    AUTOEXTEND ON NEXT 50 M MAXSIZE 500 M
    EXTENT MANAGEMENT LOCAL AUTOALLOCATE
    SEGMENT SPACE MANAGEMENT AUTO;

-- Verificar creacion
SELECT tablespace_name, status, contents
FROM   user_tablespaces
WHERE  tablespace_name IN ('TS_REPROD_2024', 'TS_REPROD_2025')
ORDER  BY tablespace_name;


-- =============================================================================
-- 2. CREACION DE TABLA PARTICIONADA
-- =============================================================================
-- REPRODUCCIONES_PART: version particionada de REPRODUCCIONES
-- Particion por rango de FECHA_HORA_INICIO:
--   PARTITION p2024: datos < 2025 → TS_REPROD_2024
--   PARTITION p2025: datos >= 2025 → TS_REPROD_2025
--
-- Se usa WHENEVER SQLERROR CONTINUE por si ya existe.

CREATE TABLE REPRODUCCIONES_PART (
    id_reproduccion   NUMBER                                    NOT NULL,
    id_perfil         NUMBER                                    NOT NULL,
    id_contenido      NUMBER                                    NOT NULL,
    id_episodio       NUMBER,
    fecha_hora_inicio TIMESTAMP                                 NOT NULL,
    fecha_hora_fin    TIMESTAMP,
    dispositivo       VARCHAR2(15)                              NOT NULL,
    porcentaje_avance NUMBER(5, 2)    DEFAULT 0                 NOT NULL,
    CONSTRAINT pk_reprod_part           PRIMARY KEY (id_reproduccion, fecha_hora_inicio),
    CONSTRAINT ck_repp_disp    CHECK (dispositivo IN ('CELULAR','TABLET','TV','COMPUTADOR')),
    CONSTRAINT ck_repp_avance  CHECK (porcentaje_avance BETWEEN 0 AND 100),
    CONSTRAINT ck_repp_fechas  CHECK (fecha_hora_fin IS NULL OR fecha_hora_fin >= fecha_hora_inicio),
    CONSTRAINT fk_repp_perfil   FOREIGN KEY (id_perfil)    REFERENCES PERFILES  (id_perfil),
    CONSTRAINT fk_repp_cont     FOREIGN KEY (id_contenido) REFERENCES CONTENIDO (id_contenido),
    CONSTRAINT fk_repp_episodio FOREIGN KEY (id_episodio)  REFERENCES EPISODIOS (id_episodio)
)
PARTITION BY RANGE (fecha_hora_inicio) (
    PARTITION p2024 VALUES LESS THAN (TIMESTAMP '2025-01-01 00:00:00')
        TABLESPACE TS_REPROD_2024,
    PARTITION p2025 VALUES LESS THAN (MAXVALUE)
        TABLESPACE TS_REPROD_2025
);

COMMENT ON TABLE REPRODUCCIONES_PART IS
    'Reproducciones particionadas por rango de fecha (p2024 en TS_REPROD_2024, p2025+ en TS_REPROD_2025)';


-- =============================================================================
-- 3. MIGRACION DE DATOS EXISTENTES
-- =============================================================================
-- Solo migra si REPRODUCCIONES_PART esta vacia (para ser re-ejecutable).
-- Usa APPEND para insercion directa y luego verifica el conteo.

DECLARE
    v_count_dest NUMBER;
    v_count_src  NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count_dest FROM REPRODUCCIONES_PART;

    IF v_count_dest = 0 THEN
        SELECT COUNT(*) INTO v_count_src FROM REPRODUCCIONES;

        INSERT /*+ APPEND */ INTO REPRODUCCIONES_PART
        SELECT * FROM REPRODUCCIONES;

        COMMIT;
        DBMS_OUTPUT.PUT_LINE('Migracion completada: ' || v_count_src || ' filas copiadas a REPRODUCCIONES_PART.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('REPRODUCCIONES_PART ya contiene ' || v_count_dest || ' filas. Se omite migracion.');
    END IF;
END;
/


-- =============================================================================
-- 4. VERIFICACION
-- =============================================================================

-- Verificar particiones creadas
SELECT  table_name,
        partition_name,
        tablespace_name,
        high_value,
        num_rows
FROM    user_tab_partitions
WHERE   table_name = 'REPRODUCCIONES_PART'
ORDER BY partition_position;

-- Verificar datos migrados
SELECT 'REPRODUCCIONES'       AS tabla, COUNT(*) AS filas FROM REPRODUCCIONES
UNION ALL
SELECT 'REPRODUCCIONES_PART', COUNT(*) FROM REPRODUCCIONES_PART;

-- Verificar distribucion por particion
SELECT  'p2024' AS particion, COUNT(*) AS filas
FROM    REPRODUCCIONES_PART PARTITION (p2024)
UNION ALL
SELECT  'p2025', COUNT(*)
FROM    REPRODUCCIONES_PART PARTITION (p2025);

COMMIT;

PROMPT Archivo 10_tablespaces_particiones.sql ejecutado correctamente.
