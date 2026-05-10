"""Routers de pagos y planes."""

from fastapi import APIRouter, HTTPException

from schemas.usuario import CambiarPlanRequest, Plan, Usuario
from schemas.pago import Pago, PagoCreate, PagoUpdateEstado
from services.plan_service import (
    listar_planes, obtener_plan, cambiar_plan,
    registrar_pago, pagos_por_usuario, calcular_monto,
)

router = APIRouter(prefix="/pagos", tags=["Pagos y Planes"])


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


@router.post("/cambiar-plan", response_model=dict)
def cambiar_plan_endpoint(data: CambiarPlanRequest):
    """Cambia el plan de un usuario usando SP_CAMBIAR_PLAN."""
    try:
        usuario = cambiar_plan(data.id_usuario, data.id_plan)
        return {"mensaje": "Plan actualizado exitosamente", "usuario": usuario}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== PAGOS ====================

@router.get("/usuarios/{id_usuario}", response_model=list[Pago])
def obtener_pagos_usuario(id_usuario: int):
    """Obtiene el historial de pagos de un usuario."""
    return pagos_por_usuario(id_usuario)


@router.post("", response_model=Pago, status_code=201)
def crear_pago(data: PagoCreate):
    """Registra un nuevo pago."""
    try:
        return registrar_pago(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{id_pago}/estado")
def actualizar_estado_pago(id_pago: int, data: PagoUpdateEstado):
    """Actualiza el estado de un pago."""
    conn = None
    try:
        from database import get_connection, release_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE PAGOS SET estado_pago = :1 WHERE id_pago = :2",
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
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        if conn:
            release_connection(conn)


@router.get("/calcular-monto/{id_usuario}")
def calcular_monto_endpoint(id_usuario: int):
    """Calcula el monto a pagar usando FN_CALCULAR_MONTO."""
    try:
        monto = calcular_monto(id_usuario)
        return {"id_usuario": id_usuario, "monto": monto}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
