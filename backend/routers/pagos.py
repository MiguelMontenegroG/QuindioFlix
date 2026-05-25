"""Routers de pagos y planes."""

import oracledb
from fastapi import APIRouter, HTTPException, Depends

from backend.database import get_connection, release_connection, fq
from backend.oracle_errors import handle_oracle_error
from backend.schemas.usuario import Plan
from backend.schemas.pago import Pago, PagoCreate, PagoUpdateEstado
from backend.services.plan_service import (
    listar_planes, obtener_plan,
    registrar_pago, pagos_por_usuario, calcular_monto,
)

router = APIRouter(prefix="/pagos", tags=["Pagos y Planes"])


# ==================== LISTAR TODOS LOS PAGOS (admin) ====================

@router.get("")
def listar_todos_pagos(
    estado: str | None = None,
    pagina: int = 1,
    por_pagina: int = 20,
):
    """Lista todos los pagos con filtro opcional por estado (admin)."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        where = ""
        binds = {}
        if estado:
            where = "WHERE p.estado_pago = :estado"
            binds["estado"] = estado

        cursor.execute(f"SELECT COUNT(*) FROM {fq('PAGOS')} p {where}", binds)
        total = cursor.fetchone()[0]

        offset = (pagina - 1) * por_pagina
        sql = f"""
            SELECT p.id_pago, p.id_usuario, p.fecha_pago, p.monto, p.metodo_pago, p.estado_pago,
                   p.fecha_vencimiento, u.nombre AS usuario_nombre, u.email AS usuario_email
            FROM {fq('PAGOS')} p
            JOIN {fq('USUARIOS')} u ON u.id_usuario = p.id_usuario
            {where}
            ORDER BY p.fecha_pago DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        """
        binds["offset"] = offset
        binds["limit"] = por_pagina
        cursor.execute(sql, binds)

        columns = [desc[0].lower() for desc in cursor.description]
        pagos = []
        for row in cursor:
            pago = dict(zip(columns, row))
            # Convertir fechas Oracle a string ISO
            for key in ('fecha_pago', 'fecha_vencimiento'):
                if key in pago and pago[key] is not None:
                    val = pago[key]
                    if hasattr(val, 'isoformat'):
                        pago[key] = val.isoformat()
                    else:
                        pago[key] = str(val)
            pagos.append(pago)
        cursor.close()
        return {"data": pagos, "total": total, "pagina": pagina, "por_pagina": por_pagina}
    finally:
        release_connection(conn, "admin")


# ==================== PLANES ====================

@router.get("/planes", response_model=list[Plan])
def obtener_planes():
    """Lista todos los planes disponibles."""
    return listar_planes()


@router.get("/planes/{id_plan}", response_model=Plan)
def obtener_plan_endpoint(id_plan: int):
    """Obtiene un plan por ID."""
    plan = obtener_plan(id_plan)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    return plan


# ==================== PAGOS ====================

@router.get("/usuarios/{id_usuario}", response_model=list[Pago])
def obtener_pagos_usuario(id_usuario: int):
    """Obtiene el historial de pagos de un usuario."""
    return pagos_por_usuario(id_usuario)


@router.post("")
def crear_pago(data: PagoCreate):
    """Registra un nuevo pago."""
    return registrar_pago(data)


@router.put("/{id_pago}/estado")
def actualizar_estado_pago(id_pago: int, data: PagoUpdateEstado):
    """Actualiza el estado de un pago."""
    conn = None
    try:
        conn = get_connection("admin")
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE {fq('PAGOS')} SET estado_pago = :1 WHERE id_pago = :2",
            [data.estado, id_pago]
        )
        if cursor.rowcount == 0:
            cursor.close()
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        conn.commit()
        cursor.close()
        return {"mensaje": f"Estado del pago actualizado a {data.estado}"}
    except HTTPException:
        raise
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        if conn:
            release_connection(conn, "admin")


@router.get("/calcular-monto/{id_usuario}")
def calcular_monto_endpoint(id_usuario: int):
    """Calcula el monto a pagar usando FN_CALCULAR_MONTO."""
    monto = calcular_monto(id_usuario)
    return {"id_usuario": id_usuario, "monto": monto}
