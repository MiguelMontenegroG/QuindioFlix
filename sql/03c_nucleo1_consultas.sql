-- =============================================================================
-- QuindioFlix -- Entrega 2 / Nucleo 1
-- Archivo 03: CONSULTAS AVANZADAS  (NT1)
--
-- Nucleo 1 . R.A.2 -- Generar informes y reportes mediante consultas
--
-- Contenido:
--   1. CONSULTAS PARAMETRIZADAS (3)
--   2. CONSULTAS CON PIVOT (2)
--   3. GROUP BY AVANZADO -- ROLLUP, CUBE, GROUPING SETS (3)
--   4. VISTAS MATERIALIZADAS (2)
--   5. FRAGMENTACION (particionamiento)
--
-- IMPORTANTE: Este script debe ejecutarse en el esquema QUINDIOFLIX
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET VERIFY OFF;


-- =============================================================================
-- 1. CONSULTAS PARAMETRIZADAS
-- =============================================================================
-- Usan variables de sustitución (&) para recibir parametros en SQL*Plus.
-- Con DEFINE se evita el doble prompt.

-- ---------------------------------------------------------------------------
-- CONSULTA PARAMETRIZADA 1: Reporte de usuarios por ciudad
-- Ejecutar con: DEFINE ciudad = Bogota; (o la ciudad deseada)
-- ---------------------------------------------------------------------------
DEFINE ciudad = Bogota

SELECT  u.id_usuario,
        u.nombre,
        u.email,
        u.ciudad,
        p.nombre_plan,
        u.estado_cuenta,
        TO_CHAR(u.fecha_registro, 'DD/MM/YYYY') AS fecha_registro,
        NVL(TO_CHAR(u.id_referidor, 'FM9999'), 'Sin referido') AS id_referidor
FROM    USUARIOS u
JOIN    PLANES p ON p.id_plan = u.id_plan
WHERE   UPPER(u.ciudad) LIKE UPPER('%&ciudad%')
ORDER   BY u.nombre;

-- Limpiar variable
UNDEFINE ciudad;

-- ---------------------------------------------------------------------------
-- CONSULTA PARAMETRIZADA 2: Reporte de pagos por mes y anio
-- Ejecutar con: DEFINE mes = 01; DEFINE anio = 2024;
-- ---------------------------------------------------------------------------
DEFINE mes  = 01
DEFINE anio = 2024

SELECT  pg.id_pago,
        u.nombre             AS usuario,
        pg.monto,
        pg.metodo_pago,
        pg.estado_pago,
        TO_CHAR(pg.fecha_pago, 'DD/MM/YYYY')       AS fecha_pago,
        TO_CHAR(pg.fecha_vencimiento, 'DD/MM/YYYY') AS vencimiento
FROM    PAGOS pg
JOIN    USUARIOS u ON u.id_usuario = pg.id_usuario
WHERE   EXTRACT(MONTH FROM pg.fecha_pago) = &mes
AND     EXTRACT(YEAR  FROM pg.fecha_pago) = &anio
ORDER   BY pg.fecha_pago DESC;

UNDEFINE mes;
UNDEFINE anio;

-- ---------------------------------------------------------------------------
-- CONSULTA PARAMETRIZADA 3: Contenido por genero
-- Ejecutar con: DEFINE genero = Accion;
-- ---------------------------------------------------------------------------
DEFINE genero = Accion

SELECT  c.id_contenido,
        c.titulo,
        cat.nombre_categoria,
        c.anio_lanzamiento,
        c.clasificacion_edad,
        CASE WHEN c.es_original = 'S' THEN 'Original QuindioFlix'
             ELSE 'Licenciado' END AS tipo_contenido,
        ROUND(c.duracion / 60, 1) AS duracion_minutos
FROM    CONTENIDO c
JOIN    CATEGORIAS cat ON cat.id_categoria = c.id_categoria
JOIN    CONTENIDO_GENERO cg ON cg.id_contenido = c.id_contenido
JOIN    GENEROS g ON g.id_genero = cg.id_genero
WHERE   UPPER(g.nombre_genero) LIKE UPPER('%&genero%')
ORDER   BY c.anio_lanzamiento DESC, c.titulo;

UNDEFINE genero;


-- =============================================================================
-- 2. CONSULTAS CON PIVOT
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PIVOT 1: Ciudades x Planes -- Cantidad de usuarios ACTIVOS
-- Las filas son las ciudades principales, las columnas son los planes.
-- ---------------------------------------------------------------------------
SELECT  *
FROM    (
    SELECT  u.ciudad,
            p.nombre_plan,
            COUNT(*) AS total_usuarios
    FROM    USUARIOS u
    JOIN    PLANES p ON p.id_plan = u.id_plan
    WHERE   u.estado_cuenta = 'ACTIVO'
    GROUP BY u.ciudad, p.nombre_plan
)
PIVOT (
    SUM(total_usuarios)
    FOR nombre_plan IN (
        'Basico'   AS basico,
        'Estandar' AS estandar,
        'Premium'  AS premium
    )
)
ORDER BY ciudad;

-- ---------------------------------------------------------------------------
-- PIVOT 2: Categorias x Dispositivos -- Reproducciones
-- Las filas son categorias de contenido, las columnas son dispositivos.
-- ---------------------------------------------------------------------------
SELECT  *
FROM    (
    SELECT  cat.nombre_categoria,
            r.dispositivo,
            COUNT(*) AS total_reprod
    FROM    REPRODUCCIONES r
    JOIN    CONTENIDO  c   ON c.id_contenido  = r.id_contenido
    JOIN    CATEGORIAS cat ON cat.id_categoria = c.id_categoria
    GROUP BY cat.nombre_categoria, r.dispositivo
)
PIVOT (
    SUM(total_reprod)
    FOR dispositivo IN (
        'CELULAR'    AS celular,
        'TABLET'     AS tablet,
        'TV'         AS tv,
        'COMPUTADOR' AS computador
    )
)
ORDER BY nombre_categoria;


-- =============================================================================
-- 3. GROUP BY AVANZADO -- ROLLUP, CUBE, GROUPING SETS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ROLLUP: Ingresos por ciudad + plan (jerarquia: total > ciudad > plan)
-- Muestra subtotales por ciudad y un gran total.
-- ---------------------------------------------------------------------------
SELECT  CASE WHEN GROUPING(u.ciudad) = 1 THEN 'TOTAL GENERAL'
             ELSE u.ciudad END AS ciudad,
        CASE WHEN GROUPING(p.nombre_plan) = 1 THEN 'SUBTOTAL'
             ELSE p.nombre_plan END AS plan,
        COUNT(DISTINCT u.id_usuario) AS usuarios,
        SUM(pg.monto) AS total_ingresos,
        ROUND(AVG(pg.monto), 2) AS promedio_por_pago
FROM    PAGOS pg
JOIN    USUARIOS u  ON u.id_usuario  = pg.id_usuario
JOIN    PLANES   p  ON p.id_plan     = u.id_plan
WHERE   pg.estado_pago = 'EXITOSO'
GROUP BY ROLLUP (u.ciudad, p.nombre_plan)
ORDER BY GROUPING(u.ciudad), GROUPING(p.nombre_plan), u.ciudad, p.nombre_plan;

-- ---------------------------------------------------------------------------
-- CUBE: Reproducciones por categoria + dispositivo (todas las combinaciones)
-- Muestra totales por categoria, por dispositivo y gran total.
-- ---------------------------------------------------------------------------
SELECT  CASE WHEN GROUPING(cat.nombre_categoria) = 1 THEN 'TOTAL'
             ELSE cat.nombre_categoria END AS categoria,
        CASE WHEN GROUPING(r.dispositivo) = 1 THEN 'TOTAL'
             ELSE r.dispositivo END AS dispositivo,
        COUNT(*) AS reproducciones,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS porcentaje
FROM    REPRODUCCIONES r
JOIN    CONTENIDO  c   ON c.id_contenido  = r.id_contenido
JOIN    CATEGORIAS cat ON cat.id_categoria = c.id_categoria
GROUP BY CUBE (cat.nombre_categoria, r.dispositivo)
ORDER BY GROUPING(cat.nombre_categoria), GROUPING(r.dispositivo),
         categoria, dispositivo;

-- ---------------------------------------------------------------------------
-- GROUPING SETS: Solo por categoria y solo por ciudad (sin jerarquia)
-- Dos agrupaciones independientes en una misma consulta.
-- ---------------------------------------------------------------------------
SELECT  CASE WHEN GROUPING(cat.nombre_categoria) = 1 THEN 'TODAS'
             ELSE cat.nombre_categoria END AS categoria,
        CASE WHEN GROUPING(u.ciudad) = 1 THEN 'TODAS'
             ELSE u.ciudad END AS ciudad,
        COUNT(DISTINCT r.id_reproduccion) AS reproducciones,
        ROUND(COUNT(DISTINCT r.id_reproduccion) * 100.0 /
              SUM(COUNT(DISTINCT r.id_reproduccion)) OVER(), 2) AS porcentaje
FROM    REPRODUCCIONES r
JOIN    PERFILES   pf  ON pf.id_perfil    = r.id_perfil
JOIN    USUARIOS   u   ON u.id_usuario    = pf.id_usuario
JOIN    CONTENIDO  c   ON c.id_contenido  = r.id_contenido
JOIN    CATEGORIAS cat ON cat.id_categoria = c.id_categoria
GROUP BY GROUPING SETS (
    (cat.nombre_categoria),   -- solo por categoria
    (u.ciudad)                -- solo por ciudad
)
ORDER BY categoria, ciudad;


-- =============================================================================
-- 4. VISTAS MATERIALIZADAS
-- =============================================================================
-- Ambas con BUILD IMMEDIATE (se poblan al crearse) y
-- REFRESH COMPLETE ON DEMAND (se refrescan manualmente).

-- ---------------------------------------------------------------------------
-- MV_CONTENIDO_POPULAR: Reproducciones + calificacion promedio por contenido
-- Util para el endpoint de popularidad sin recalcular cada vez.
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW MV_CONTENIDO_POPULAR
BUILD IMMEDIATE
REFRESH COMPLETE ON DEMAND
AS
SELECT  c.id_contenido,
        c.titulo,
        cat.nombre_categoria,
        c.clasificacion_edad,
        COUNT(DISTINCT r.id_reproduccion)              AS total_reproducciones,
        COUNT(DISTINCT pf_vieron.id_perfil)             AS perfiles_que_vieron,
        NVL(ROUND(AVG(cal.estrellas), 2), 0)           AS promedio_estrellas,
        COUNT(DISTINCT cal.id_calificacion)             AS total_calificaciones,
        COUNT(DISTINCT f.id_perfil)                     AS total_favoritos,
        ROUND(
            (COUNT(DISTINCT r.id_reproduccion) * 0.40)
          + (NVL(AVG(cal.estrellas), 0) * 10 * 0.35)
          + (COUNT(DISTINCT f.id_perfil) * 0.25)
        , 2)                                             AS indice_popularidad
FROM    CONTENIDO   c
JOIN    CATEGORIAS  cat ON cat.id_categoria = c.id_categoria
LEFT JOIN REPRODUCCIONES r   ON r.id_contenido = c.id_contenido
LEFT JOIN PERFILES pf_vieron ON pf_vieron.id_perfil = r.id_perfil
LEFT JOIN CALIFICACIONES cal ON cal.id_contenido = c.id_contenido
LEFT JOIN FAVORITOS      f   ON f.id_contenido  = c.id_contenido
GROUP BY c.id_contenido, c.titulo, cat.nombre_categoria, c.clasificacion_edad;

COMMENT ON MATERIALIZED VIEW MV_CONTENIDO_POPULAR IS
    'Contenido mas popular: reproducciones, calificaciones, favoritos e indice compuesto';

-- Verificar creacion
SELECT mview_name, refresh_mode, last_refresh_date
FROM   user_mviews
WHERE  mview_name = 'MV_CONTENIDO_POPULAR';

-- ---------------------------------------------------------------------------
-- MV_INGRESOS_MENSUAL: Ingresos por ciudad + plan (pagos EXITOSOS)
-- Util para el panel de analitica de finanzas.
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW MV_INGRESOS_MENSUAL
BUILD IMMEDIATE
REFRESH COMPLETE ON DEMAND
AS
SELECT  TO_CHAR(pg.fecha_pago, 'YYYY-MM')               AS mes_anio,
        EXTRACT(YEAR  FROM pg.fecha_pago)                AS anio,
        EXTRACT(MONTH FROM pg.fecha_pago)                AS mes,
        u.ciudad,
        p.nombre_plan,
        COUNT(DISTINCT u.id_usuario)                     AS usuarios_activos,
        COUNT(pg.id_pago)                                AS total_pagos,
        SUM(pg.monto)                                    AS ingresos_totales,
        ROUND(AVG(pg.monto), 2)                          AS ingreso_promedio
FROM    PAGOS pg
JOIN    USUARIOS u  ON u.id_usuario  = pg.id_usuario
JOIN    PLANES   p  ON p.id_plan     = u.id_plan
WHERE   pg.estado_pago = 'EXITOSO'
GROUP BY TO_CHAR(pg.fecha_pago, 'YYYY-MM'),
         EXTRACT(YEAR  FROM pg.fecha_pago),
         EXTRACT(MONTH FROM pg.fecha_pago),
         u.ciudad,
         p.nombre_plan;

COMMENT ON MATERIALIZED VIEW MV_INGRESOS_MENSUAL IS
    'Ingresos mensuales por ciudad y plan (solo pagos EXITOSOS)';

-- Verificar creacion
SELECT mview_name, refresh_mode, last_refresh_date
FROM   user_mviews
WHERE  mview_name = 'MV_INGRESOS_MENSUAL';

-- ---------------------------------------------------------------------------
-- Refrescar vistas materializadas (ejecutar cuando se requiera)
-- ---------------------------------------------------------------------------
BEGIN
    DBMS_MVIEW.REFRESH('MV_CONTENIDO_POPULAR', 'C');
    DBMS_MVIEW.REFRESH('MV_INGRESOS_MENSUAL',  'C');
    DBMS_OUTPUT.PUT_LINE('Vistas materializadas refrescadas exitosamente.');
END;
/

-- Verificar datos en las vistas
SELECT 'MV_CONTENIDO_POPULAR' AS vista, COUNT(*) AS filas FROM MV_CONTENIDO_POPULAR
UNION ALL
SELECT 'MV_INGRESOS_MENSUAL',  COUNT(*) FROM MV_INGRESOS_MENSUAL;


-- =============================================================================
-- 5. FRAGMENTACION (PARTICIONAMIENTO)
-- =============================================================================
-- Justificacion:
--   REPRODUCCIONES es la tabla que mas crece en el sistema (~200 registros por
--   mes en produccion). Las consultas de historial siempre filtran por rango de
--   fechas (fecha_hora_inicio). Particionar por rango de fechas permite:
--   1. Eliminar datos viejos con DROP PARTITION (mucho mas rapido que DELETE).
--   2. Consultas que solo acceden a la particion relevante (partition pruning).
--   3. Respaldos incrementales por periodo.
--
--   Estrategia: particion por rango anual con 3 particiones:
--     - p2024: datos historicos del anio de lanzamiento
--     - p2025: datos del anio actual
--     - p_futuro: datos futuros (limite MAXVALUE)
--
--   En produccion se recomienda particionar por mes y agregar particiones
--   automaticamente con interval partitioning (Oracle 12c+).
-- =============================================================================

-- Nota: Como la tabla ya existe con datos, mostramos el diseno DDL para
-- crearla desde cero con particionamiento. Para aplicar a una tabla existente
-- se requiere DBMS_REDEFINITION (online) o crear tabla nueva y migrar datos.

/*
-- DDL para crear REPRODUCCIONES con particionamiento (ejecutar solo si se
-- reconstruye la tabla desde cero):

CREATE TABLE REPRODUCCIONES_PART (
    id_reproduccion   NUMBER        CONSTRAINT pk_reprod_part PRIMARY KEY,
    id_perfil         NUMBER        CONSTRAINT nn_repp_perfil NOT NULL,
    id_contenido      NUMBER        CONSTRAINT nn_repp_cont   NOT NULL,
    id_episodio       NUMBER,
    fecha_hora_inicio TIMESTAMP     CONSTRAINT nn_repp_inicio NOT NULL,
    fecha_hora_fin    TIMESTAMP,
    dispositivo       VARCHAR2(15)  CONSTRAINT nn_repp_disp   NOT NULL,
    porcentaje_avance NUMBER(5, 2)  DEFAULT 0                NOT NULL,
    CONSTRAINT ck_repp_disp    CHECK (dispositivo IN ('CELULAR','TABLET','TV','COMPUTADOR')),
    CONSTRAINT ck_repp_avance  CHECK (porcentaje_avance BETWEEN 0 AND 100),
    CONSTRAINT ck_repp_fechas  CHECK (fecha_hora_fin IS NULL OR fecha_hora_fin >= fecha_hora_inicio),
    CONSTRAINT fk_repp_perfil   FOREIGN KEY (id_perfil)    REFERENCES PERFILES  (id_perfil),
    CONSTRAINT fk_repp_cont     FOREIGN KEY (id_contenido) REFERENCES CONTENIDO (id_contenido),
    CONSTRAINT fk_repp_episodio FOREIGN KEY (id_episodio)  REFERENCES EPISODIOS (id_episodio)
)
PARTITION BY RANGE (fecha_hora_inicio) (
    PARTITION p2024   VALUES LESS THAN (TIMESTAMP '2025-01-01 00:00:00')
        TABLESPACE users,
    PARTITION p2025   VALUES LESS THAN (TIMESTAMP '2026-01-01 00:00:00')
        TABLESPACE users,
    PARTITION p_futuro VALUES LESS THAN (MAXVALUE)
        TABLESPACE users
);

COMMENT ON TABLE REPRODUCCIONES_PART IS
    'Version particionada de REPRODUCCIONES por rango de fechas (particion anual)';
*/

-- Verificar el diseno de particionamiento propuesto
SELECT  'REPRODUCCIONES' AS tabla,
        'RANGE'          AS tipo_particion,
        'fecha_hora_inicio' AS columna_particion,
        'p2024 (< 2025), p2025 (< 2026), p_futuro (MAXVALUE)' AS particiones
FROM    DUAL;

-- Consulta de ejemplo que se beneficia del partition pruning:
EXPLAIN PLAN SET STATEMENT_ID = 'PART_PRUNE' FOR
    SELECT  r.id_reproduccion, c.titulo, r.porcentaje_avance
    FROM    REPRODUCCIONES r
    JOIN    CONTENIDO c ON c.id_contenido = r.id_contenido
    WHERE   r.fecha_hora_inicio >= TIMESTAMP '2024-01-01 00:00:00'
    AND     r.fecha_hora_inicio <  TIMESTAMP '2024-04-01 00:00:00';

SELECT plan_table_output
FROM   TABLE(DBMS_XPLAN.DISPLAY('PLAN_TABLE', 'PART_PRUNE', 'TYPICAL'))
ORDER  BY 1;


-- =============================================================================
-- PRUEBAS DE VERIFICACION
-- =============================================================================

/*
-- Verificar PIVOT 1: Ciudades x Planes
SELECT * FROM (
    SELECT ciudad, nombre_plan, COUNT(*) AS cnt
    FROM USUARIOS u JOIN PLANES p ON p.id_plan = u.id_plan
    WHERE estado_cuenta = 'ACTIVO'
    GROUP BY ciudad, nombre_plan
)
PIVOT (SUM(cnt) FOR nombre_plan IN ('Basico' AS basico, 'Estandar' AS estandar, 'Premium' AS premium))
ORDER BY ciudad;

-- Verificar ROLLUP
SELECT CASE WHEN GROUPING(ciudad)=1 THEN 'TOTAL' ELSE ciudad END AS ciudad,
       CASE WHEN GROUPING(nombre_plan)=1 THEN 'SUBTOTAL' ELSE nombre_plan END AS plan,
       SUM(monto) AS ingresos
FROM PAGOS pg JOIN USUARIOS u ON u.id_usuario=pg.id_usuario
     JOIN PLANES p ON p.id_plan=u.id_plan
WHERE pg.estado_pago='EXITOSO'
GROUP BY ROLLUP(ciudad, nombre_plan);

-- Verificar MV
SELECT * FROM MV_CONTENIDO_POPULAR ORDER BY indice_popularidad DESC FETCH FIRST 10 ROWS ONLY;
SELECT * FROM MV_INGRESOS_MENSUAL ORDER BY anio DESC, mes DESC;
*/

COMMIT;
