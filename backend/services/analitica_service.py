"""Servicio de analitica: KPIs, PIVOT, ROLLUP, CUBE con Oracle."""

from ..database import get_connection, release_connection, fq
from ..schemas.analitica import (
    KPIsDashboard, ConsumoPorCiudad, ReproduccionesPorDispositivo,
    ReporteFinanciero, ContenidoPopular, ReporteEquipo, EstadisticasModeracion,
)


def obtener_kpis() -> KPIsDashboard:
    """Obtiene los KPIs del dashboard principal."""
    conn = get_connection("analista")
    try:
        cursor = conn.cursor()
        # Usuarios activos
        cursor.execute(f"SELECT COUNT(*) FROM {fq('USUARIOS')} WHERE estado_cuenta = 'ACTIVO'")
        usuarios_activos = cursor.fetchone()[0]

        # Ingresos del mes
        cursor.execute(
            f"""SELECT NVL(SUM(monto), 0) FROM {fq('PAGOS')}
               WHERE EXTRACT(MONTH FROM fecha_pago) = EXTRACT(MONTH FROM SYSDATE)
               AND EXTRACT(YEAR FROM fecha_pago) = EXTRACT(YEAR FROM SYSDATE)
               AND estado_pago = 'EXITOSO'"""
        )
        ingresos_mes = float(cursor.fetchone()[0])

        # Reproducciones totales
        cursor.execute(f"SELECT COUNT(*) FROM {fq('REPRODUCCIONES')}")
        reproducciones_totales = cursor.fetchone()[0]

        # Contenido mas popular
        cursor.execute(
            f"""SELECT c.id_contenido, c.titulo, COUNT(r.id_reproduccion) as total_rep
               FROM {fq('CONTENIDO')} c
               JOIN {fq('REPRODUCCIONES')} r ON r.id_contenido = c.id_contenido
               GROUP BY c.id_contenido, c.titulo
               ORDER BY total_rep DESC FETCH FIRST 5 ROWS ONLY"""
        )
        popular = [
            {"id_contenido": r[0], "titulo": r[1], "total_reproducciones": r[2]}
            for r in cursor
        ]

        # Crecimiento de usuarios (porcentaje vs mes anterior)
        cursor.execute(
            f"""WITH MES_ACTUAL AS (
                SELECT COUNT(*) AS total FROM {fq('USUARIOS')}
                WHERE EXTRACT(MONTH FROM fecha_registro) = EXTRACT(MONTH FROM SYSDATE)
                AND EXTRACT(YEAR FROM fecha_registro) = EXTRACT(YEAR FROM SYSDATE)
            ), MES_ANTERIOR AS (
                SELECT COUNT(*) AS total FROM {fq('USUARIOS')}
                WHERE EXTRACT(MONTH FROM fecha_registro) = EXTRACT(MONTH FROM ADD_MONTHS(SYSDATE, -1))
                AND EXTRACT(YEAR FROM fecha_registro) = EXTRACT(YEAR FROM ADD_MONTHS(SYSDATE, -1))
            )
            SELECT CASE WHEN ma.total = 0 THEN 0
                   ELSE ROUND((mc.total - ma.total) * 100.0 / ma.total, 2)
                   END
            FROM MES_ACTUAL mc, MES_ANTERIOR ma"""
        )
        crecimiento = float(cursor.fetchone()[0])

        # Tasa de conversion (pagos exitosos / total intentos)
        cursor.execute(
            f"""SELECT CASE WHEN COUNT(*) = 0 THEN 0
                      ELSE ROUND(SUM(CASE WHEN estado_pago = 'EXITOSO' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2)
                      END
               FROM {fq('PAGOS')}"""
        )
        tasa_conversion = float(cursor.fetchone()[0])

        cursor.close()

        return KPIsDashboard(
            usuarios_activos=usuarios_activos,
            ingresos_mes=ingresos_mes,
            reproducciones_totales=reproducciones_totales,
            contenido_mas_popular=popular,
            crecimiento_usuarios=crecimiento,
            tasa_conversion=tasa_conversion,
        )
    finally:
        release_connection(conn, "analista")


def consumo_por_ciudad() -> list[dict]:
    """Ejecuta consulta con ROLLUP para agrupar por ciudad."""
    conn = get_connection("analista")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT NVL(u.ciudad, 'TOTAL') AS ciudad,
                      COUNT(u.id_usuario) AS total_usuarios,
                      NVL(SUM(p.monto), 0) AS ingresos_totales
               FROM {fq('USUARIOS')} u
               LEFT JOIN {fq('PAGOS')} p ON p.id_usuario = u.id_usuario
               GROUP BY ROLLUP(u.ciudad)
               ORDER BY u.ciudad"""
        )
        rows = [{"ciudad": r[0], "total_usuarios": r[1], "ingresos_totales": float(r[2])} for r in cursor]
        cursor.close()
        return rows
    finally:
        release_connection(conn, "analista")


def reproducciones_por_dispositivo() -> list[dict]:
    """Ejecuta consulta con PIVOT para cruzar categoria vs dispositivo."""
    conn = get_connection("analista")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT * FROM (
                SELECT cat.nombre_categoria, r.dispositivo, COUNT(*) AS total
                FROM {fq('REPRODUCCIONES')} r
                JOIN {fq('CONTENIDO')} c ON c.id_contenido = r.id_contenido
                JOIN {fq('CATEGORIAS')} cat ON cat.id_categoria = c.id_categoria
                GROUP BY cat.nombre_categoria, r.dispositivo
            ) PIVOT (
                SUM(total) FOR dispositivo IN ('CELULAR' AS celular, 'TABLET' AS tablet, 'TV' AS tv, 'COMPUTADOR' AS computador)
            )
            ORDER BY nombre_categoria"""
        )
        columns = [desc[0] for desc in cursor.description]
        rows = [dict(zip(columns, r)) for r in cursor]
        cursor.close()
        return rows
    finally:
        release_connection(conn, "analista")


def reporte_financiero(mes: str = None, anio: int = None) -> list[dict]:
    """Reporte financiero con CUBE por ciudad-plan-mes."""
    conn = get_connection("analista")
    try:
        cursor = conn.cursor()
        year_filter = f"AND EXTRACT(YEAR FROM p.fecha_pago) = {anio}" if anio else ""
        month_filter = f"AND EXTRACT(MONTH FROM p.fecha_pago) = {int(mes)}" if mes else ""

        cursor.execute(
            f"""SELECT NVL(u.ciudad, 'TOTAL') AS ciudad,
                       NVL(pl.nombre_plan, 'TOTAL') AS plan,
                       NVL(TO_CHAR(p.fecha_pago, 'YYYY-MM'), 'TOTAL') AS mes,
                       NVL(SUM(p.monto), 0) AS ingresos,
                       COUNT(DISTINCT u.id_usuario) AS usuarios
                FROM {fq('USUARIOS')} u
                JOIN {fq('PLANES')} pl ON pl.id_plan = u.id_plan
                LEFT JOIN {fq('PAGOS')} p ON p.id_usuario = u.id_usuario
                    AND p.estado_pago = 'EXITOSO'
                    {year_filter} {month_filter}
                GROUP BY CUBE(u.ciudad, pl.nombre_plan, TO_CHAR(p.fecha_pago, 'YYYY-MM'))
                ORDER BY u.ciudad, pl.nombre_plan, mes"""
        )
        columns = [desc[0] for desc in cursor.description]
        rows = []
        for r in cursor:
            row = dict(zip(columns, r))
            if row.get("INGRESOS") is not None:
                row["INGRESOS"] = float(row["INGRESOS"])
            rows.append(row)
        cursor.close()
        return rows
    finally:
        release_connection(conn, "analista")


def contenido_popular(limite: int = 10) -> list[ContenidoPopular]:
    """Obtiene el contenido mas popular por reproducciones."""
    conn = get_connection("analista")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT c.id_contenido, c.titulo,
                      COUNT(r.id_reproduccion) AS total_reproducciones,
                      ROUND(AVG(r.porcentaje_avance), 2) AS promedio_avance,
                      ROUND(AVG(cal.estrellas), 2) AS calificacion_promedio
               FROM {fq('CONTENIDO')} c
               LEFT JOIN {fq('REPRODUCCIONES')} r ON r.id_contenido = c.id_contenido
               LEFT JOIN {fq('CALIFICACIONES')} cal ON cal.id_contenido = c.id_contenido
               GROUP BY c.id_contenido, c.titulo
               ORDER BY total_reproducciones DESC
               FETCH FIRST :1 ROWS ONLY""", [limite]
        )
        rows = [ContenidoPopular(
            id_contenido=r[0], titulo=r[1], total_reproducciones=r[2],
            promedio_avance=float(r[3]) if r[3] else 0,
            calificacion_promedio=float(r[4]) if r[4] else 0
        ) for r in cursor]
        cursor.close()
        return rows
    finally:
        release_connection(conn, "analista")


def reporte_equipo() -> list[ReporteEquipo]:
    """Reporte de empleados por departamento con jerarquia."""
    conn = get_connection("analista")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT d.nombre_depto,
                      COUNT(e.id_empleado) AS total_empleados,
                      SUM(CASE WHEN e.id_supervisor IS NOT NULL THEN 1 ELSE 0 END) AS con_supervisor,
                      SUM(CASE WHEN e.id_supervisor IS NULL THEN 1 ELSE 0 END) AS sin_supervisor
               FROM {fq('DEPARTAMENTOS')} d
               LEFT JOIN {fq('EMPLEADOS')} e ON e.id_departamento = d.id_departamento
               GROUP BY d.nombre_depto
               ORDER BY d.nombre_depto"""
        )
        rows = [ReporteEquipo(
            departamento=r[0], total_empleados=r[1],
            empleados_con_supervisor=r[2], empleados_sin_supervisor=r[3]
        ) for r in cursor]
        cursor.close()
        return rows
    finally:
        release_connection(conn, "analista")


def estadisticas_moderacion() -> EstadisticasModeracion:
    """Estadisticas de moderacion de reportes."""
    conn = get_connection("analista")
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT COUNT(*) FROM {fq('REPORTES')}")
        total = cursor.fetchone()[0]

        cursor.execute(f"SELECT COUNT(*) FROM {fq('REPORTES')} WHERE estado_reporte = 'PENDIENTE'")
        pendientes = cursor.fetchone()[0]

        cursor.execute(f"SELECT COUNT(*) FROM {fq('REPORTES')} WHERE estado_reporte = 'RESUELTO'")
        resueltos = cursor.fetchone()[0]

        cursor.execute(f"SELECT COUNT(*) FROM {fq('REPORTES')} WHERE estado_reporte = 'RECHAZADO'")
        rechazados = cursor.fetchone()[0]

        cursor.execute(
            f"""SELECT ROUND(AVG((fecha_resolucion - fecha_reporte) * 24), 2)
               FROM {fq('REPORTES')} WHERE estado_reporte IN ('RESUELTO', 'RECHAZADO')
               AND fecha_resolucion IS NOT NULL"""
        )
        tiempo_promedio = cursor.fetchone()[0]

        cursor.close()

        return EstadisticasModeracion(
            total_reportes=total, pendientes=pendientes,
            resueltos=resueltos, rechazados=rechazados,
            tiempo_promedio_resolucion_horas=float(tiempo_promedio) if tiempo_promedio else None
        )
    finally:
        release_connection(conn, "analista")
