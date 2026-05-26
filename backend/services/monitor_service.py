"""Servicio de monitoreo en tiempo real de la base de datos Oracle.

Proporciona funciones asincronas para consultar el estado de la BD
y generar eventos SSE con las metricas principales.
"""

import time
from ..database import get_connection, release_connection, fq


def obtener_estadisticas_generales() -> dict:
    """Obtiene las metricas principales de la BD."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        stats = {}

        # Total usuarios
        cursor.execute(f"SELECT COUNT(*) FROM {fq('USUARIOS')}")
        stats["total_usuarios"] = cursor.fetchone()[0]

        # Usuarios activos vs inactivos
        cursor.execute(
            f"""SELECT estado_cuenta, COUNT(*) as cnt
                FROM {fq('USUARIOS')}
                GROUP BY estado_cuenta"""
        )
        activos = 0
        inactivos = 0
        for row in cursor:
            if row[0] and row[0].upper() == "ACTIVO":
                activos = row[1]
            else:
                inactivos += row[1]
        stats["usuarios_activos"] = activos
        stats["usuarios_inactivos"] = inactivos

        # Total contenido
        cursor.execute(f"SELECT COUNT(*) FROM {fq('CONTENIDO')}")
        stats["total_contenido"] = cursor.fetchone()[0]

        # Total reproducciones
        cursor.execute(f"SELECT COUNT(*) FROM {fq('REPRODUCCIONES')}")
        stats["total_reproducciones"] = cursor.fetchone()[0]

        # Total pagos
        cursor.execute(f"SELECT COUNT(*) FROM {fq('PAGOS')}")
        stats["total_pagos"] = cursor.fetchone()[0]

        # Ingresos del mes actual
        cursor.execute(
            f"""SELECT NVL(SUM(monto), 0)
                FROM {fq('PAGOS')}
                WHERE estado_pago = 'EXITOSO'
                  AND EXTRACT(MONTH FROM fecha_pago) = EXTRACT(MONTH FROM SYSDATE)
                  AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM SYSDATE)"""
        )
        stats["ingresos_mes"] = float(cursor.fetchone()[0])

        # Reproducciones hoy
        cursor.execute(
            f"""SELECT COUNT(*)
                FROM {fq('REPRODUCCIONES')}
                WHERE TRUNC(fecha_hora_inicio) = TRUNC(SYSDATE)"""
        )
        stats["reproducciones_hoy"] = cursor.fetchone()[0]

        # Usuarios nuevos hoy
        cursor.execute(
            f"""SELECT COUNT(*)
                FROM {fq('USUARIOS')}
                WHERE TRUNC(fecha_registro) = TRUNC(SYSDATE)"""
        )
        stats["usuarios_nuevos_hoy"] = cursor.fetchone()[0]

        # Planes mas populares
        cursor.execute(
            f"""SELECT p.nombre_plan, COUNT(*) as total
                FROM {fq('USUARIOS')} u
                JOIN {fq('PLANES')} p ON u.id_plan = p.id_plan
                GROUP BY p.nombre_plan
                ORDER BY total DESC"""
        )
        stats["planes"] = []
        for row in cursor:
            stats["planes"].append({"nombre": row[0], "total": row[1]})

        # Contenido mas visto (top 5)
        cursor.execute(
            f"""SELECT c.titulo, COUNT(r.id_reproduccion) as vistas
                FROM {fq('REPRODUCCIONES')} r
                JOIN {fq('CONTENIDO')} c ON r.id_contenido = c.id_contenido
                GROUP BY c.titulo
                ORDER BY vistas DESC
                FETCH FIRST 5 ROWS ONLY"""
        )
        stats["top_contenido"] = []
        for row in cursor:
            stats["top_contenido"].append({"titulo": row[0], "vistas": row[1]})

        # Contenido mejor calificado (top 5)
        cursor.execute(
            f"""SELECT c.titulo, ROUND(AVG(cal.estrellas), 2) as promedio, COUNT(cal.id_calificacion) as votos
                FROM {fq('CALIFICACIONES')} cal
                JOIN {fq('CONTENIDO')} c ON cal.id_contenido = c.id_contenido
                GROUP BY c.titulo
                HAVING COUNT(cal.id_calificacion) >= 2
                ORDER BY promedio DESC
                FETCH FIRST 5 ROWS ONLY"""
        )
        stats["top_calificado"] = []
        for row in cursor:
            stats["top_calificado"].append({"titulo": row[0], "promedio": float(row[1]), "votos": row[2]})

        # Pagos pendientes
        cursor.execute(
            f"""SELECT COUNT(*)
                FROM {fq('PAGOS')}
                WHERE estado_pago = 'PENDIENTE'"""
        )
        stats["pagos_pendientes"] = cursor.fetchone()[0]

        # Timestamp de la consulta
        cursor.execute("SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') FROM DUAL")
        stats["timestamp"] = cursor.fetchone()[0]

        cursor.close()
        return stats
    finally:
        release_connection(conn, "admin")


def obtener_ultimos_registros(limite: int = 5) -> dict:
    """Obtiene los ultimos registros de las tablas principales."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        data = {}

        # Ultimos usuarios registrados
        cursor.execute(
            f"""SELECT id_usuario, nombre, email, 
                      TO_CHAR(fecha_registro, 'YYYY-MM-DD HH24:MI:SS') as fecha
                FROM {fq('USUARIOS')}
                ORDER BY fecha_registro DESC
                FETCH FIRST {limite} ROWS ONLY"""
        )
        columns = [desc[0] for desc in cursor.description]
        data["ultimos_usuarios"] = [dict(zip(columns, r)) for r in cursor]

        # Ultimas reproducciones
        cursor.execute(
            f"""SELECT r.id_reproduccion, c.titulo, 
                      TO_CHAR(r.fecha_hora_inicio, 'YYYY-MM-DD HH24:MI:SS') as fecha
                FROM {fq('REPRODUCCIONES')} r
                JOIN {fq('CONTENIDO')} c ON r.id_contenido = c.id_contenido
                ORDER BY r.fecha_hora_inicio DESC
                FETCH FIRST {limite} ROWS ONLY"""
        )
        columns = [desc[0] for desc in cursor.description]
        data["ultimas_reproducciones"] = [dict(zip(columns, r)) for r in cursor]

        # Ultimos pagos
        cursor.execute(
            f"""SELECT p.id_pago, u.nombre, p.monto, p.estado_pago,
                      TO_CHAR(p.fecha_pago, 'YYYY-MM-DD HH24:MI:SS') as fecha
                FROM {fq('PAGOS')} p
                JOIN {fq('USUARIOS')} u ON p.id_usuario = u.id_usuario
                ORDER BY p.fecha_pago DESC
                FETCH FIRST {limite} ROWS ONLY"""
        )
        columns = [desc[0] for desc in cursor.description]
        data["ultimos_pagos"] = [dict(zip(columns, r)) for r in cursor]

        cursor.close()
        return data
    finally:
        release_connection(conn, "admin")
