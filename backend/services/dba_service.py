"""Servicio DBA: EXPLAIN PLAN, tablespaces, vistas materializadas."""

from database import get_connection, release_connection


def transacciones_activas() -> list[dict]:
    """Obtiene transacciones activas y bloqueos."""
    conn = get_connection()
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
        release_connection(conn)


def explain_plan(query: str) -> list[dict]:
    """Ejecuta EXPLAIN PLAN para una consulta SQL."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        # Limpiar plan table
        cursor.execute("DELETE FROM PLAN_TABLE")
        # Ejecutar explain
        cursor.execute(f"EXPLAIN PLAN SET STATEMENT_ID = 'QUINDIOFLIX' FOR {query}")
        # Obtener resultado
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
        release_connection(conn)


def vistas_materializadas() -> list[dict]:
    """Obtiene informacion de vistas materializadas."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT mview_name AS nombre,
                      TO_CHAR(last_refresh_date, 'YYYY-MM-DD HH24:MI:SS') AS ultima_actualizacion,
                      CASE WHEN status = 'VALID' THEN 'valida' ELSE 'invalida' END AS estado,
                      refresh_mode AS modo_refresh,
                      NUM_ROWS AS filas
               FROM user_mviews
               ORDER BY mview_name"""
        )
        columns = [desc[0] for desc in cursor.description]
        rows = [dict(zip(columns, r)) for r in cursor]
        cursor.close()
        return rows
    finally:
        release_connection(conn)


def refrescar_vista(nombre: str) -> dict:
    """Refresca una vista materializada."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(f"BEGIN DBMS_MVIEW.REFRESH('{nombre}', 'C'); END;")
        conn.commit()
        cursor.close()
        return {"mensaje": f"Vista {nombre} refrescada exitosamente"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        release_connection(conn)


def tablespaces() -> list[dict]:
    """Obtiene informacion de tablespaces y uso."""
    conn = get_connection()
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
        release_connection(conn)


def ejecutar_renovacion_mensual() -> dict:
    """Ejecuta el proceso de renovacion mensual de suscripciones."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        # Marcar usuarios como INACTIVO si su ultimo pago vencio hace mas de 30 dias
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
        release_connection(conn)
