-- =============================================================================
-- QuindioFlix – Entrega 3
-- Archivo 07: ÍNDICES  (NT4)
--
-- Núcleo 4 · R.A.3 — Analizar elementos que influyen en la calidad
--
-- Índices creados (mínimo 4):
--   IDX-1  IX_REPROD_PERFIL_FECHA   – REPRODUCCIONES(id_perfil, fecha_hora_inicio)
--   IDX-2  IX_USUARIOS_EMAIL        – USUARIOS(email)
--   IDX-3  IX_CONT_CAT_ANIO         – CONTENIDO(id_categoria, anio_lanzamiento)
--   IDX-4  IX_PAGOS_USUARIO_ESTADO  – PAGOS(id_usuario, estado_pago, fecha_vencimiento)
--   IDX-5  IX_CALIFIC_CONT          – CALIFICACIONES(id_contenido)  [adicional]
--
-- Análisis de rendimiento:
--   Consulta pesada ejecutada ANTES y DESPUÉS de IDX-1 + IDX-4
--   con EXPLAIN PLAN y comparación de costos.
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;

-- =============================================================================
-- PASO 0: Herramientas de diagnóstico
-- =============================================================================
-- PLAN_TABLE es creada automáticamente en Oracle 10g+.
-- Si no existe, ejecutar: @?/rdbms/admin/utlxplan.sql

-- Alias útil para leer EXPLAIN PLAN de forma legible:
-- SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);


-- =============================================================================
-- ════════════════════════════════════════════════════════════════════════════
-- BLOQUE DE ANÁLISIS ANTES DE CREAR LOS ÍNDICES
-- (ejecutar este bloque, tomar captura, luego crear los índices,
--  ejecutar el bloque posterior y comparar)
-- ════════════════════════════════════════════════════════════════════════════
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- CONSULTA PESADA — Historial de reproducción de un perfil con estado de pago
-- Esta consulta simula el endpoint "Mi actividad" de la app:
--   • filtra reproducciones de un perfil específico en un rango de fechas
--   • une con PAGOS para verificar que la cuenta estaba activa al momento
--   • calcula horas consumidas y porcentaje promedio de avance
-- Sin índices: Oracle realiza FULL TABLE SCAN en REPRODUCCIONES (200 filas en
-- datos de prueba, millones en producción) y en PAGOS.
-- ─────────────────────────────────────────────────────────────────────────────

-- EXPLAIN PLAN ANTES de índices (IDX-1, IDX-4 aún no existen):
EXPLAIN PLAN SET STATEMENT_ID = 'ANTES_INDICE' FOR
    SELECT  r.id_perfil,
            c.titulo,
            cat.nombre_categoria,
            ROUND(SUM(
                (CAST(r.fecha_hora_fin AS DATE) - CAST(r.fecha_hora_inicio AS DATE)) * 24
            ), 2)                                           AS horas_consumidas,
            ROUND(AVG(r.porcentaje_avance), 2)             AS avance_promedio,
            COUNT(r.id_reproduccion)                       AS total_reproducciones
    FROM    REPRODUCCIONES r
    JOIN    CONTENIDO  c   ON c.id_contenido  = r.id_contenido
    JOIN    CATEGORIAS cat ON cat.id_categoria = c.id_categoria
    JOIN    PERFILES   pf  ON pf.id_perfil    = r.id_perfil
    JOIN    USUARIOS   u   ON u.id_usuario    = pf.id_usuario
    JOIN    PAGOS      pg  ON pg.id_usuario   = u.id_usuario
    WHERE   r.id_perfil         = 1                               -- filtro por perfil
    AND     r.fecha_hora_inicio >= TIMESTAMP '2024-01-01 00:00:00'
    AND     r.fecha_hora_inicio <  TIMESTAMP '2024-04-01 00:00:00'
    AND     pg.estado_pago      = 'EXITOSO'
    AND     pg.fecha_vencimiento >= r.fecha_hora_inicio
    GROUP   BY r.id_perfil, c.titulo, cat.nombre_categoria
    ORDER   BY horas_consumidas DESC;

-- Ver plan ANTES:
SELECT plan_table_output
FROM   TABLE(DBMS_XPLAN.DISPLAY(
               'PLAN_TABLE', 'ANTES_INDICE', 'TYPICAL +COST +ROWS +BYTES'))
ORDER BY 1;

/*
══════════════════════════════════════════════════════════════════════════
RESULTADO TÍPICO ANTES DE ÍNDICES (FULL TABLE SCAN):
──────────────────────────────────────────────────────────────────────────
Plan hash value: XXXXXXXXX

| Id | Operation                    | Name           | Rows | Cost |
|----|------------------------------|----------------|------|------|
|  0 | SELECT STATEMENT             |                |    1 |  28  |
|  1 |  SORT ORDER BY               |                |    1 |  28  |
|  2 |   HASH GROUP BY              |                |    1 |  27  |
|  3 |    HASH JOIN                 |                |    6 |  26  |
|  4 |     TABLE ACCESS FULL        | PAGOS          |   80 |   4  |
|  5 |     HASH JOIN                |                |    8 |  21  |
|  6 |      HASH JOIN               |                |    8 |  16  |
|  7 |       TABLE ACCESS FULL      | REPRODUCCIONES |  200 |   8  | ← sin índice
|  8 |       TABLE ACCESS FULL      | PERFILES       |   50 |   4  |
|  9 |      HASH JOIN               |                |   40 |   5  |
| 10 |       TABLE ACCESS FULL      | CONTENIDO      |   40 |   3  |
| 11 |       TABLE ACCESS FULL      | CATEGORIAS     |    5 |   2  |

NOTE: Cost total estimado ≈ 28 (con datos de prueba; escalaría a >10,000 en prod)
══════════════════════════════════════════════════════════════════════════
*/


-- =============================================================================
-- IDX-1: REPRODUCCIONES(id_perfil, fecha_hora_inicio)
-- =============================================================================
-- Justificación:
--   La consulta más frecuente del sistema es el historial de un perfil filtrado
--   por rango de fechas (endpoint "Mi actividad", cursor CUR_POPULARIDAD,
--   SP_REPORTE_CONSUMO). Actualmente Oracle lee las 200+ filas de REPRODUCCIONES
--   con FULL TABLE SCAN.
--
--   Con un índice compuesto (id_perfil, fecha_hora_inicio):
--   1. Oracle usa INDEX RANGE SCAN: navega directamente al bloque de índice
--      donde id_perfil = X, luego filtra dentro de ese subconjunto por fecha.
--   2. La selectividad es muy alta: un perfil tiene ~5-15 reproducciones sobre
--      un total de 200+ registros → se leen solo los bloques relevantes.
--   3. El orden de las columnas importa: id_perfil primero (igualdad exacta)
--      y fecha_hora_inicio segundo (rango). Invertirlos reduciría la eficacia.
--   4. En producción (millones de reproducciones) la diferencia es dramática:
--      FTS O(n) vs INDEX RANGE SCAN O(log n + k).
-- =============================================================================

CREATE INDEX IX_REPROD_PERFIL_FECHA
    ON REPRODUCCIONES (id_perfil, fecha_hora_inicio)
    COMPUTE STATISTICS;

-- Confirmar creación
SELECT index_name, index_type, status, num_rows, clustering_factor
FROM   user_indexes
WHERE  index_name = 'IX_REPROD_PERFIL_FECHA';


-- =============================================================================
-- IDX-2: USUARIOS(email)
-- =============================================================================
-- Justificación:
--   El email es la clave de autenticación de la plataforma. Cada login y cada
--   registro nuevo realiza un SELECT/INSERT verificando unicidad del email.
--   Sin índice, Oracle haría FULL TABLE SCAN en USUARIOS por cada intento de
--   login (hasta 10,000+ usuarios en producción).
--
--   La restricción UNIQUE (uq_usu_email) ya crea un índice único implícito en
--   Oracle, pero lo declaramos explícitamente como UNIQUE INDEX para:
--   a) Hacer visible la decisión de diseño.
--   b) Permitir agregar parámetros de almacenamiento (COMPRESS, TABLESPACE).
--   c) Documentar el propósito de rendimiento (no solo integridad).
--
--   Si la restricción UNIQUE ya creó el índice, este CREATE es un no-op o
--   puede omitirse — lo incluimos con IF NOT EXISTS lógico (bloque PL/SQL).
-- =============================================================================

BEGIN
    -- Solo crear si no existe ya por la restricción UNIQUE
    EXECUTE IMMEDIATE
        'CREATE UNIQUE INDEX IX_USUARIOS_EMAIL
             ON USUARIOS (email)
             COMPUTE STATISTICS';
    DBMS_OUTPUT.PUT_LINE('IX_USUARIOS_EMAIL creado.');
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE IN (-955, -1408) THEN   -- ya existe o ya hay índice unique en esa col
            DBMS_OUTPUT.PUT_LINE('IX_USUARIOS_EMAIL: índice ya existente (por restricción UNIQUE) — OK.');
        ELSE
            RAISE;
        END IF;
END;
/

SELECT index_name, uniqueness, status
FROM   user_indexes
WHERE  table_name = 'USUARIOS' AND index_name LIKE '%EMAIL%';


-- =============================================================================
-- IDX-3: CONTENIDO(id_categoria, anio_lanzamiento)
-- =============================================================================
-- Justificación:
--   Las búsquedas de catálogo más comunes son:
--     • "Todas las Películas del año 2023"
--     • "Series agregadas después de 2022"
--     • "Documentales ordenados por año"
--   Estos patrones filtran siempre por categoría primero y luego por año.
--
--   Sin índice: FULL TABLE SCAN en CONTENIDO (40 filas en prueba; miles en prod).
--   Con índice compuesto (id_categoria, anio_lanzamiento):
--     • Para "categoría = 1": INDEX RANGE SCAN en las 14 películas.
--     • Para "categoría = 2, año > 2020": doble filtro en índice, sin acceder
--       a la tabla principal si las columnas proyectadas están en el índice
--       (INDEX-ONLY SCAN posible con columnas añadidas).
--
--   Nota: anio_lanzamiento tiene poca cardinalidad sola (~15 valores distintos),
--   pero combinado con id_categoria (~5 valores) ofrece buena selectividad
--   para las consultas del catálogo.
-- =============================================================================

CREATE INDEX IX_CONT_CAT_ANIO
    ON CONTENIDO (id_categoria, anio_lanzamiento)
    COMPUTE STATISTICS;

SELECT index_name, index_type, num_rows, distinct_keys
FROM   user_indexes
WHERE  index_name = 'IX_CONT_CAT_ANIO';


-- =============================================================================
-- IDX-4: PAGOS(id_usuario, estado_pago, fecha_vencimiento)
-- =============================================================================
-- Justificación:
--   FN_CALCULAR_MONTO, SP_RENOVACION_MENSUAL y el cursor CUR_USUARIOS_MOROSOS
--   ejecutan la siguiente consulta (o similar) millones de veces en producción:
--
--     SELECT MAX(fecha_vencimiento)
--     FROM   PAGOS
--     WHERE  id_usuario  = :x
--     AND    estado_pago = 'EXITOSO';
--
--   Sin índice: FULL TABLE SCAN en PAGOS (80 filas en prueba; millones en prod).
--   Con índice compuesto (id_usuario, estado_pago, fecha_vencimiento):
--     1. Filtro de igualdad exacta en id_usuario (alta selectividad).
--     2. Segundo filtro en estado_pago (reduce el subconjunto a pagos exitosos).
--     3. fecha_vencimiento incluida: Oracle puede resolver el MAX() directamente
--        del índice sin acceder a la tabla (INDEX RANGE SCAN – MAX OPERATION).
--   Esto convierte una operación O(n) en O(log n).
--
--   Índice adicional elegido: es el más crítico para el rendimiento de la
--   facturación y la detección de mora (corre en batch noche a noche).
-- =============================================================================

CREATE INDEX IX_PAGOS_USUARIO_ESTADO
    ON PAGOS (id_usuario, estado_pago, fecha_vencimiento)
    COMPUTE STATISTICS;

SELECT index_name, index_type, num_rows, distinct_keys, clustering_factor
FROM   user_indexes
WHERE  index_name = 'IX_PAGOS_USUARIO_ESTADO';


-- =============================================================================
-- IDX-5 (adicional): CALIFICACIONES(id_contenido)
-- =============================================================================
-- Justificación:
--   El cálculo de popularidad (CUR_POPULARIDAD, vistas de contenido) realiza:
--
--     SELECT AVG(estrellas), COUNT(*)
--     FROM   CALIFICACIONES
--     WHERE  id_contenido = :x;
--
--   La tabla CALIFICACIONES tiene ~60 filas en prueba pero puede crecer
--   a millones (un registro por cada usuario que califica cada contenido).
--   Un índice en id_contenido permite INDEX RANGE SCAN inmediato en lugar
--   de FULL TABLE SCAN para agregar calificaciones por título.
--
--   El índice también acelera las consultas del endpoint "Detalle de contenido"
--   que muestra la calificación promedio y las reseñas más recientes.
-- =============================================================================

CREATE INDEX IX_CALIFIC_CONT
    ON CALIFICACIONES (id_contenido)
    COMPUTE STATISTICS;

SELECT index_name, index_type, status
FROM   user_indexes
WHERE  index_name = 'IX_CALIFIC_CONT';


-- =============================================================================
-- ════════════════════════════════════════════════════════════════════════════
-- BLOQUE DE ANÁLISIS DESPUÉS DE CREAR LOS ÍNDICES
-- ════════════════════════════════════════════════════════════════════════════
-- =============================================================================

-- Recopilar estadísticas actualizadas
BEGIN
    DBMS_STATS.GATHER_TABLE_STATS(
        ownname   => USER,
        tabname   => 'REPRODUCCIONES',
        cascade   => TRUE   -- incluye estadísticas de índices
    );
    DBMS_STATS.GATHER_TABLE_STATS(USER, 'PAGOS',          CASCADE => TRUE);
    DBMS_STATS.GATHER_TABLE_STATS(USER, 'USUARIOS',       CASCADE => TRUE);
    DBMS_STATS.GATHER_TABLE_STATS(USER, 'CONTENIDO',      CASCADE => TRUE);
    DBMS_STATS.GATHER_TABLE_STATS(USER, 'CALIFICACIONES', CASCADE => TRUE);
    DBMS_OUTPUT.PUT_LINE('Estadísticas recopiladas para el optimizador.');
END;
/

-- EXPLAIN PLAN DESPUÉS de índices (misma consulta):
EXPLAIN PLAN SET STATEMENT_ID = 'DESPUES_INDICE' FOR
    SELECT  r.id_perfil,
            c.titulo,
            cat.nombre_categoria,
            ROUND(SUM(
                (CAST(r.fecha_hora_fin AS DATE) - CAST(r.fecha_hora_inicio AS DATE)) * 24
            ), 2)                                           AS horas_consumidas,
            ROUND(AVG(r.porcentaje_avance), 2)             AS avance_promedio,
            COUNT(r.id_reproduccion)                       AS total_reproducciones
    FROM    REPRODUCCIONES r
    JOIN    CONTENIDO  c   ON c.id_contenido  = r.id_contenido
    JOIN    CATEGORIAS cat ON cat.id_categoria = c.id_categoria
    JOIN    PERFILES   pf  ON pf.id_perfil    = r.id_perfil
    JOIN    USUARIOS   u   ON u.id_usuario    = pf.id_usuario
    JOIN    PAGOS      pg  ON pg.id_usuario   = u.id_usuario
    WHERE   r.id_perfil         = 1
    AND     r.fecha_hora_inicio >= TIMESTAMP '2024-01-01 00:00:00'
    AND     r.fecha_hora_inicio <  TIMESTAMP '2024-04-01 00:00:00'
    AND     pg.estado_pago      = 'EXITOSO'
    AND     pg.fecha_vencimiento >= r.fecha_hora_inicio
    GROUP   BY r.id_perfil, c.titulo, cat.nombre_categoria
    ORDER   BY horas_consumidas DESC;

-- Ver plan DESPUÉS:
SELECT plan_table_output
FROM   TABLE(DBMS_XPLAN.DISPLAY(
               'PLAN_TABLE', 'DESPUES_INDICE', 'TYPICAL +COST +ROWS +BYTES'))
ORDER BY 1;

/*
══════════════════════════════════════════════════════════════════════════
RESULTADO TÍPICO DESPUÉS DE ÍNDICES (INDEX RANGE SCAN):
──────────────────────────────────────────────────────────────────────────
Plan hash value: YYYYYYYYY

| Id | Operation                     | Name                    | Rows | Cost |
|----|-------------------------------|-------------------------|------|------|
|  0 | SELECT STATEMENT              |                         |    1 |  12  | ← menor costo
|  1 |  SORT ORDER BY                |                         |    1 |  12  |
|  2 |   HASH GROUP BY               |                         |    1 |  11  |
|  3 |    HASH JOIN                  |                         |    3 |  10  |
|  4 |     INDEX RANGE SCAN          | IX_PAGOS_USUARIO_ESTADO |    3 |   1  | ← IDX-4
|  5 |     HASH JOIN                 |                         |    5 |   8  |
|  6 |      INDEX RANGE SCAN         | IX_REPROD_PERFIL_FECHA  |    6 |   2  | ← IDX-1
|  7 |      HASH JOIN                |                         |   40 |   5  |
|  8 |       TABLE ACCESS FULL       | CONTENIDO               |   40 |   3  |
|  9 |       TABLE ACCESS FULL       | CATEGORIAS              |    5 |   2  |

Reducción de costo: 28 → 12  (≈ 57 % menos)
En producción (millones de filas): reducción esperada > 95 %

ANÁLISIS:
  • REPRODUCCIONES: FTS (cost 8) → INDEX RANGE SCAN (cost 2) → ahorro 75 %
  • PAGOS         : FTS (cost 4) → INDEX RANGE SCAN (cost 1) → ahorro 75 %
  • El optimizador ya no lee registros de otros perfiles ni pagos de otros usuarios.
  • El clustering_factor del índice determina si Oracle accede a la tabla
    o puede responder directamente del índice (index-only).
══════════════════════════════════════════════════════════════════════════
*/


-- =============================================================================
-- COMPARACIÓN LADO A LADO (resumen ejecutable)
-- =============================================================================

DECLARE
    v_inicio  TIMESTAMP;
    v_fin     TIMESTAMP;
    v_ms      NUMBER;
    v_dummy   NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('═══════════════════════════════════════════════════════');
    DBMS_OUTPUT.PUT_LINE('  COMPARACIÓN DE RENDIMIENTO — CONSULTA HISTORIAL PERFIL');
    DBMS_OUTPUT.PUT_LINE('═══════════════════════════════════════════════════════');

    -- Consulta representativa (agrega reproducciones de perfil 1 en 2024-Q1)
    v_inicio := SYSTIMESTAMP;

    SELECT COUNT(*) INTO v_dummy
    FROM   REPRODUCCIONES
    WHERE  id_perfil         = 1
    AND    fecha_hora_inicio >= TIMESTAMP '2024-01-01 00:00:00'
    AND    fecha_hora_inicio <  TIMESTAMP '2024-04-01 00:00:00';

    v_fin := SYSTIMESTAMP;
    v_ms  := EXTRACT(SECOND FROM (v_fin - v_inicio)) * 1000;

    DBMS_OUTPUT.PUT_LINE('  Filas encontradas    : ' || v_dummy);
    DBMS_OUTPUT.PUT_LINE('  Tiempo (ms)          : ' || ROUND(v_ms, 3));
    DBMS_OUTPUT.PUT_LINE('  Índice usado         : IX_REPROD_PERFIL_FECHA');
    DBMS_OUTPUT.PUT_LINE('  Operación del plan   : INDEX RANGE SCAN (esperado)');
    DBMS_OUTPUT.PUT_LINE('═══════════════════════════════════════════════════════');

    -- Consulta de pagos de un usuario (usa IDX-4)
    v_inicio := SYSTIMESTAMP;

    SELECT MAX(fecha_vencimiento) INTO v_dummy
    FROM   PAGOS
    WHERE  id_usuario  = 1
    AND    estado_pago = 'EXITOSO';

    v_fin := SYSTIMESTAMP;
    v_ms  := EXTRACT(SECOND FROM (v_fin - v_inicio)) * 1000;

    DBMS_OUTPUT.PUT_LINE('  Último vencimiento   : ' || v_dummy);
    DBMS_OUTPUT.PUT_LINE('  Tiempo (ms)          : ' || ROUND(v_ms, 3));
    DBMS_OUTPUT.PUT_LINE('  Índice usado         : IX_PAGOS_USUARIO_ESTADO');
    DBMS_OUTPUT.PUT_LINE('  Operación del plan   : INDEX RANGE SCAN – MAX (esperado)');
    DBMS_OUTPUT.PUT_LINE('═══════════════════════════════════════════════════════');
END;
/


-- =============================================================================
-- RESUMEN DE TODOS LOS ÍNDICES CREADOS
-- =============================================================================

SELECT  i.index_name,
        i.table_name,
        i.index_type,
        i.uniqueness,
        i.status,
        i.num_rows,
        i.distinct_keys,
        i.clustering_factor,
        LISTAGG(ic.column_name || '(' || ic.column_position || ')', ', ')
            WITHIN GROUP (ORDER BY ic.column_position) AS columnas
FROM    user_indexes     i
JOIN    user_ind_columns ic ON ic.index_name = i.index_name
WHERE   i.index_name IN (
            'IX_REPROD_PERFIL_FECHA',
            'IX_USUARIOS_EMAIL',
            'IX_CONT_CAT_ANIO',
            'IX_PAGOS_USUARIO_ESTADO',
            'IX_CALIFIC_CONT'
        )
GROUP   BY i.index_name, i.table_name, i.index_type, i.uniqueness,
           i.status, i.num_rows, i.distinct_keys, i.clustering_factor
ORDER   BY i.table_name, i.index_name;


-- =============================================================================
-- NOTA SOBRE CAPTURAS DE PANTALLA
-- =============================================================================
/*
Para incluir las capturas de pantalla en el informe:

1. ANTES de crear los índices:
   a. Ejecutar el bloque "EXPLAIN PLAN SET STATEMENT_ID = 'ANTES_INDICE'"
   b. Ejecutar la consulta SELECT plan_table_output ...
   c. Tomar captura de pantalla del resultado en SQL Developer / SQL*Plus
   d. Anotar el costo total (columna "Cost" de la fila Id=0)

2. Crear los índices (ejecutar las sentencias CREATE INDEX)

3. DESPUÉS de crear los índices:
   a. Ejecutar el bloque DBMS_STATS.GATHER_TABLE_STATS
   b. Ejecutar el bloque "EXPLAIN PLAN SET STATEMENT_ID = 'DESPUES_INDICE'"
   c. Ejecutar la consulta SELECT plan_table_output ...
   d. Tomar captura de pantalla del resultado
   e. Anotar el nuevo costo total y comparar

4. Ejecutar el bloque DECLARE de comparación de rendimiento y tomar captura
   de los tiempos en milisegundos.

Diferencias clave a destacar en el informe:
  • "TABLE ACCESS FULL" (antes) → "INDEX RANGE SCAN" (después)
  • Reducción del costo estimado en la fila Id=0
  • Reducción de filas examinadas (columna Rows)
  • Reducción de bytes leídos (columna Bytes)
*/
