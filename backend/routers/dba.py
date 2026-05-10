"""Routers DBA: transacciones, EXPLAIN PLAN, vistas materializadas, tablespaces.
Todos los endpoints requieren autenticacion de administrador.
"""

from fastapi import APIRouter, HTTPException, Depends

from dependencies import get_current_admin
from services.dba_service import (
    transacciones_activas, explain_plan, vistas_materializadas,
    refrescar_vista, tablespaces, ejecutar_renovacion_mensual,
)

router = APIRouter(prefix="/dba", tags=["Herramientas DBA"], dependencies=[Depends(get_current_admin)])


@router.get("/transacciones")
def obtener_transacciones():
    """Obtiene transacciones activas y bloqueos en Oracle."""
    return transacciones_activas()


@router.post("/explain-plan")
def analizar_query(data: dict):
    """Ejecuta EXPLAIN PLAN para una consulta SQL."""
    if "query" not in data or not data["query"].strip():
        raise HTTPException(status_code=400, detail="Se requiere una consulta SQL")
    resultado = explain_plan(data["query"])
    return {"query": data["query"], "plan": resultado}


@router.get("/vistas-materializadas")
def obtener_vistas():
    """Obtiene informacion de vistas materializadas."""
    return vistas_materializadas()


@router.post("/vistas-materializadas/{nombre}/refrescar")
def refrescar_vista_endpoint(nombre: str):
    """Refresca una vista materializada."""
    resultado = refrescar_vista(nombre)
    if "error" in resultado:
        raise HTTPException(status_code=400, detail=resultado["error"])
    return resultado


@router.get("/tablespaces")
def obtener_tablespaces():
    """Obtiene informacion de tablespaces y su uso."""
    return tablespaces()


@router.post("/renovacion-mensual")
def renovacion_mensual():
    """Ejecuta el proceso de renovacion mensual de suscripciones."""
    try:
        return ejecutar_renovacion_mensual()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
