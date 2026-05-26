"""Servicio DBA: EXPLAIN PLAN, tablespaces, vistas materializadas, SQL directo."""

from ..database import get_connection, release_connection, fq
from ..config import settings


def transacciones_activas() -> list[dict]:
    """Obtiene transacciones activas y bloqueos."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT s.sid || ',' || s.serial# AS id,
                      s.username AS usuario,
                      CASE WHEN l.type = 'TM' THEN 'DML'
                           WHEN l.type = 'TX' THEN 'TRANSACCION'
                           ELSE l.type END AS tipo_bloqueo,
                      TO_CHAR(s.logon_time, 'YYYY-MM-DD HH24:MI:SS') AS inicio,
                      s.status AS estado,
                      NVL(o.object_name, '-') AS tabla
               FROM v$session s
               LEFT JOIN v$lock l ON l.sid = s.sid
               LEFT JOIN dba_objects o ON o.object_id = l.id1
               WHERE s.username IS NOT NULL
                 AND s.status = 'ACTIVE'
                 AND s.type != 'BACKGROUND'
               ORDER BY s.logon_time"""
        )
        columns = [desc[0] for desc in cursor.description]
        rows = [dict(zip(columns, r)) for r in cursor]
        cursor.close()
        return rows
    finally:
        release_connection(conn, "admin")


def explain_plan(query: str) -> list[dict]:
    """Ejecuta EXPLAIN PLAN para una consulta SQL."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM PLAN_TABLE")
        cursor.execute(f"EXPLAIN PLAN SET STATEMENT_ID = 'QUINDIOFLIX' FOR {query}")
        cursor.execute(
            """SELECT operation, object_name, cost, cardinality, time
               FROM PLAN_TABLE
               WHERE statement_id = 'QUINDIOFLIX'
               START WITH id = 0
               CONNECT BY PRIOR id = parent_id
               ORDER BY id"""
        )
        columns = [desc[0] for desc in cursor.description]
        rows = [dict(zip(columns, r)) for r in cursor]
        cursor.close()
        return rows
    except Exception as e:
        return [{"error": str(e)}]
    finally:
        release_connection(conn, "admin")


def vistas_materializadas() -> list[dict]:
    """Obtiene informacion de vistas materializadas."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT mview_name AS nombre,
                      TO_CHAR(last_refresh_date, 'YYYY-MM-DD HH24:MI:SS') AS ultima_actualizacion,
                      'valida' AS estado,
                      refresh_mode AS modo_refresh
               FROM user_mviews
               ORDER BY mview_name"""
        )
        columns = [desc[0] for desc in cursor.description]
        rows = [dict(zip(columns, r)) for r in cursor]
        cursor.close()
        return rows
    finally:
        release_connection(conn, "admin")


def refrescar_vista(nombre: str) -> dict:
    """Refresca una vista materializada."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(f"BEGIN DBMS_MVIEW.REFRESH('{nombre}', 'C'); END;")
        conn.commit()
        cursor.close()
        return {"mensaje": f"Vista {nombre} refrescada exitosamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        release_connection(conn, "admin")


def tablespaces() -> list[dict]:
    """Obtiene informacion de tablespaces y uso."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT df.tablespace_name AS nombre,
                      ROUND(df.bytes / 1024 / 1024, 2) AS tamanio_mb,
                      ROUND((df.bytes - fs.bytes) / 1024 / 1024, 2) AS usado_mb,
                      ROUND(fs.bytes / 1024 / 1024, 2) AS libre_mb,
                      ROUND((df.bytes - fs.bytes) * 100 / df.bytes, 2) AS porcentaje_usado
               FROM (SELECT tablespace_name, SUM(bytes) bytes FROM dba_data_files GROUP BY tablespace_name) df
               JOIN (SELECT tablespace_name, SUM(bytes) bytes FROM dba_free_space GROUP BY tablespace_name) fs
                 ON fs.tablespace_name = df.tablespace_name
               ORDER BY df.tablespace_name"""
        )
        columns = [desc[0] for desc in cursor.description]
        rows = [dict(zip(columns, (float(v) if isinstance(v, (int, float)) else v for v in r))) for r in cursor]
        cursor.close()
        return rows
    finally:
        release_connection(conn, "admin")


def ejecutar_renovacion_mensual() -> dict:
    """Ejecuta el proceso de renovacion mensual de suscripciones."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            """UPDATE USUARIOS u SET estado_cuenta = 'INACTIVO'
               WHERE u.estado_cuenta = 'ACTIVO'
               AND NOT EXISTS (
                   SELECT 1 FROM PAGOS p
                   WHERE p.id_usuario = u.id_usuario
                   AND p.estado_pago = 'EXITOSO'
                   AND p.fecha_vencimiento >= SYSDATE
               )"""
        )
        inactivados = cursor.rowcount
        conn.commit()
        cursor.close()
        return {"mensaje": f"Renovacion completada. {inactivados} usuarios marcados como INACTIVO."}
    except Exception:
        conn.rollback()
        raise
    finally:
        release_connection(conn, "admin")


def ejecutar_consulta_sql(query: str, limite: int = 100) -> dict:
    """Ejecuta una consulta SELECT directa y retorna columnas + filas.

    Solo acepta SELECT como medida de seguridad. Establece CURRENT_SCHEMA
    para que las tablas sin prefijo se resuelvan al esquema del proyecto.
    """
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()

        # --- 1. Establecer CURRENT_SCHEMA (para tablas sin calificar) ---
        if settings.DB_SCHEMA:
            try:
                cursor.execute(f"ALTER SESSION SET CURRENT_SCHEMA = {settings.DB_SCHEMA}")
            except Exception:
                try:
                    cursor.execute(f'ALTER SESSION SET CURRENT_SCHEMA = "{settings.DB_SCHEMA}"')
                except Exception:
                    pass  # Si falla, no importa, las tablas con prefijo funcionaran igual

        # --- 2. Ejecutar COUNT(*) ---
        cursor.execute(f"SELECT COUNT(*) FROM ({query})")
        total = cursor.fetchone()[0]

        # --- 3. Ejecutar SELECT con datos y limite ROWNUM ---
        cursor.execute(f"SELECT * FROM ({query}) WHERE ROWNUM <= {limite}")
        columns = [desc[0] for desc in cursor.description]
        rows = []
        for r in cursor:
            row = {}
            for i, col in enumerate(columns):
                val = r[i]
                if hasattr(val, 'isoformat'):
                    val = val.isoformat()
                elif val is None:
                    val = None
                elif isinstance(val, (int, float)):
                    pass  # mantener tipo nativo
                else:
                    val = str(val)
                row[col] = val
            rows.append(row)

        cursor.close()
        return {
            "columns": columns,
            "rows": rows,
            "total": total,
            "limite": limite,
            "mostrando": len(rows),
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        release_connection(conn, "admin")

# =============================================================================
# NUEVAS FUNCIONES — Tablespaces de Reproducciones y Vistas Materializadas
# =============================================================================


def tablespaces_reproducciones() -> list[dict]:
    """Obtiene informacion detallada de TS_REPROD_2024 y TS_REPROD_2025.

    Filtra solo los tablespaces de reproducciones para el panel DBA.
    Retorna nombre, tamanio_mb, usado_mb, libre_mb, porcentaje_usado,
    tipo y tabla_asociada.
    """
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT df.tablespace_name AS nombre,
                      ROUND(df.bytes / 1024 / 1024, 2) AS tamanio_mb,
                      ROUND((df.bytes - fs.bytes) / 1024 / 1024, 2) AS usado_mb,
                      ROUND(fs.bytes / 1024 / 1024, 2) AS libre_mb,
                      ROUND((df.bytes - fs.bytes) * 100 / df.bytes, 2) AS porcentaje_usado,
                      'PERMANENTE' AS tipo,
                      'REPRODUCCIONES_PART' AS tabla_asociada
               FROM (SELECT tablespace_name, SUM(bytes) bytes FROM dba_data_files GROUP BY tablespace_name) df
               JOIN (SELECT tablespace_name, SUM(bytes) bytes FROM dba_free_space GROUP BY tablespace_name) fs
                 ON fs.tablespace_name = df.tablespace_name
               WHERE df.tablespace_name IN ('TS_REPROD_2024', 'TS_REPROD_2025')
               ORDER BY df.tablespace_name"""
        )
        columns = [desc[0] for desc in cursor.description]
        rows = [dict(zip(columns, (float(v) if isinstance(v, (int, float)) else v for v in r))) for r in cursor]
        cursor.close()
        return rows
    finally:
        release_connection(conn, "admin")


def vistas_materializadas_detalle() -> list[dict]:
    """Obtiene informacion detallada de las MVs del esquema.

    No usa NUM_ROWS porque no existe en todas las versiones de Oracle.
    Incluye metodo_refresh, propietario.
    """
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT m.mview_name AS nombre,
                      TO_CHAR(m.last_refresh_date, 'YYYY-MM-DD HH24:MI:SS') AS ultima_actualizacion,
                      'valida' AS estado,
                      m.refresh_mode AS modo_refresh,
                      m.refresh_method AS metodo_refresh,
                      m.owner AS propietario
               FROM user_mviews m
               ORDER BY m.mview_name"""
        )
        columns = [desc[0] for desc in cursor.description]
        rows = [dict(zip(columns, r)) for r in cursor]
        cursor.close()
        return rows
    finally:
        release_connection(conn, "admin")


def refrescar_vista_por_nombre(data: dict) -> dict:
    """Refresca una vista materializada recibida desde el body.

    Args:
        data: Diccionario con clave 'nombre' indicando la MV a refrescar.

    Returns:
        Dict con mensaje de exito o error.
    """
    nombre = data.get("nombre", "").strip()
    if not nombre:
        return {"error": "El campo 'nombre' es requerido"}
    return refrescar_vista(nombre)
