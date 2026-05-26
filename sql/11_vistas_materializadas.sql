-- =============================================================================
-- QuindioFlix -- Vistas Materializadas para DBA
-- Archivo 11: Creacion de vistas materializadas de negocio
--
-- Crea dos vistas materializadas para paneles de administracion:
--   MV_POPULARIDAD_CONTENIDO  → Reproducciones + calificaciones por contenido
--   MV_INGRESOS_MENSUALES     → Ingresos agrupados por ciudad y plan
--
-- Usa CREATE OR REPLACE FORCE MATERIALIZED VIEW para ser re-ejecutable.
-- Refresco: COMPLETE ON DEMAND (no interfieren con operaciones en curso).
--
-- Ejecutar DESPUES de 10_tablespaces_particiones.sql
-- =============================================================================

WHENEVER SQLERROR CONTINUE;

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET VERIFY OFF;


-- =============================================================================
-- 1. MV_POPULARIDAD_CONTENIDO
-- =============================================================================
-- Total de reproducciones y calificacion promedio por contenido.
-- Util para el panel de analitica y recomendaciones sin recalcular cada vez.

CREATE OR REPLACE FORCE MATERIALIZED VIEW MV_POPULARIDAD_CONTENIDO
BUILD IMMEDIATE
REFRESH COMPLETE ON DEMAND
AS
SELECT  c.id_contenido,
        c.titulo,
        cat.nombre_categoria,
        c.clasificacion_edad,
        COUNT(DISTINCT r.id_reproduccion)              AS total_reproducciones,
        COUNT(DISTINCT pf_vieron.id_perfil)             AS perfiles_que_vieron,
        NVL(ROUND(AVG(cal.estrellas), 2), 0)           AS calificacion_promedio,
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

COMMENT ON MATERIALIZED VIEW MV_POPULARIDAD_CONTENIDO IS
    'Popularidad de contenido: reproducciones, calificaciones, favoritos e indice compuesto';


-- =============================================================================
-- 2. MV_INGRESOS_MENSUALES
-- =============================================================================
-- Ingresos por ciudad y plan, agrupados por mes y anio.
-- Solo considera pagos EXITOSOS.

CREATE OR REPLACE FORCE MATERIALIZED VIEW MV_INGRESOS_MENSUALES
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

COMMENT ON MATERIALIZED VIEW MV_INGRESOS_MENSUALES IS
    'Ingresos mensuales por ciudad y plan (pagos EXITOSOS)';


-- =============================================================================
-- 3. REFRESCAR VISTAS INMEDIATAMENTE
-- =============================================================================
-- Pobla las MVs con los datos actuales para que esten disponibles de inmediato.

BEGIN
    DBMS_MVIEW.REFRESH('MV_POPULARIDAD_CONTENIDO', 'C');
    DBMS_OUTPUT.PUT_LINE('MV_POPULARIDAD_CONTENIDO refrescada.');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error refrescando MV_POPULARIDAD_CONTENIDO: ' || SQLERRM);
END;
/

BEGIN
    DBMS_MVIEW.REFRESH('MV_INGRESOS_MENSUALES', 'C');
    DBMS_OUTPUT.PUT_LINE('MV_INGRESOS_MENSUALES refrescada.');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error refrescando MV_INGRESOS_MENSUALES: ' || SQLERRM);
END;
/


-- =============================================================================
-- 4. VERIFICACION
-- =============================================================================

SELECT mview_name, refresh_mode, last_refresh_date, status, num_rows
FROM   user_mviews
WHERE  mview_name IN ('MV_POPULARIDAD_CONTENIDO', 'MV_INGRESOS_MENSUALES')
ORDER  BY mview_name;

SELECT 'MV_POPULARIDAD_CONTENIDO' AS vista, COUNT(*) AS filas FROM MV_POPULARIDAD_CONTENIDO
UNION ALL
SELECT 'MV_INGRESOS_MENSUALES',  COUNT(*) FROM MV_INGRESOS_MENSUALES;

COMMIT;

PROMPT Archivo 11_vistas_materializadas.sql ejecutado correctamente.
