"""Routers de reportes de contenido y moderacion."""

from fastapi import APIRouter, HTTPException, Query

from database import get_connection, release_connection
from schemas.reporte import Reporte, ReporteCreate, ResolverReporte

router = APIRouter(prefix="/reportes", tags=["Reportes y Moderacion"])


@router.post("", response_model=Reporte, status_code=201)
def crear_reporte(data: ReporteCreate):
    """Crea un reporte de contenido inapropiado."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO REPORTES (id_reporte, id_perfil_reportador, id_contenido, motivo, estado_reporte)
               VALUES (seq_reportes.NEXTVAL, :1, :2, :3, 'PENDIENTE')
               RETURNING id_reporte, fecha_reporte INTO :4, :5""",
            [data.id_perfil_reportador, data.id_contenido, data.motivo,
             cursor.var(int), cursor.var(str)]
        )
        id_reporte, fecha = cursor.fetchone()
        conn.commit()
        cursor.close()
        return Reporte(
            id_reporte=id_reporte, id_perfil_reportador=data.id_perfil_reportador,
            id_contenido=data.id_contenido, motivo=data.motivo,
            fecha_reporte=fecha, estado_reporte="PENDIENTE"
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        release_connection(conn)


@router.get("")
def listar_reportes(
    estado: str = Query(None, pattern=r"^(PENDIENTE|EN_REVISION|RESUELTO|RECHAZADO)$"),
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
):
    """Lista reportes con filtro opcional por estado."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        where = ""
        binds = {}
        if estado:
            where = "WHERE r.estado_reporte = :estado"
            binds["estado"] = estado

        # Total
        cursor.execute(f"SELECT COUNT(*) FROM REPORTES r {where}", binds)
        total = cursor.fetchone()[0]

        # Paginacion
        offset = (pagina - 1) * por_pagina
        sql = f"""
            SELECT * FROM (
                SELECT r.*, ROWNUM rn FROM REPORTES r {where}
                ORDER BY r.fecha_reporte DESC
            ) WHERE rn > :offset AND rn <= :limit
        """
        binds["offset"] = offset
        binds["limit"] = offset + por_pagina
        cursor.execute(sql, binds)

        columns = [desc[0] for desc in cursor.description]
        reportes = []
        for r in cursor:
            reportes.append(dict(zip(columns, r)))

        cursor.close()
        return {"data": reportes, "total": total, "pagina": pagina, "por_pagina": por_pagina}
    finally:
        release_connection(conn)


@router.put("/{id_reporte}/resolver", response_model=Reporte)
def resolver_reporte(id_reporte: int, data: ResolverReporte):
    """Resuelve o rechaza un reporte (moderador)."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """UPDATE REPORTES SET estado_reporte = :1, comentario_moderador = :2,
               fecha_resolucion = SYSDATE
               WHERE id_reporte = :3""",
            [data.estado, data.comentario_moderador, id_reporte]
        )
        if cursor.rowcount == 0:
            cursor.close()
            raise HTTPException(status_code=404, detail="Reporte no encontrado")
        conn.commit()
        cursor.close()

        # Retornar reporte actualizado
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM REPORTES WHERE id_reporte = :1", [id_reporte])
        row = cursor.fetchone()
        cursor.close()
        if not row:
            raise HTTPException(status_code=404, detail="Reporte no encontrado")

        return Reporte(
            id_reporte=row[0], id_perfil_reportador=row[1], id_contenido=row[2],
            motivo=row[3], fecha_reporte=row[4], estado_reporte=row[5],
            id_moderador=row[6], fecha_resolucion=row[7], comentario_moderador=row[8]
        )
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        release_connection(conn)
