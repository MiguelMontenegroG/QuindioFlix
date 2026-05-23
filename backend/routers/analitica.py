"""Routers de analitica: KPIs, PIVOT, ROLLUP, CUBE, reportes financieros."""

from fastapi import APIRouter, Query, Depends

from backend.dependencies import require_roles

from backend.services.analitica_service import (
    obtener_kpis, consumo_por_ciudad, reproducciones_por_dispositivo,
    reporte_financiero, contenido_popular, reporte_equipo,
    estadisticas_moderacion,
)

router = APIRouter(prefix="/reportes", tags=["Analitica"])


@router.get("/kpis")
def kpis():
    """KPIs del dashboard principal."""
    return obtener_kpis()


@router.get("/consumo-ciudad")
def consumo_ciudad():
    """Reporte ROLLUP: consumo por ciudad."""
    return consumo_por_ciudad()


@router.get("/reproducciones-dispositivo")
def reproducciones_dispositivo():
    """Reporte PIVOT: reproducciones por categoria y dispositivo."""
    return reproducciones_por_dispositivo()


@router.get("/financiero")
def financiero(
    mes: str = Query(None, description="Numero de mes (1-12)"),
    anio: int = Query(None, description="Anio"),
):
    """Reporte CUBE: financiero por ciudad-plan-mes."""
    data = reporte_financiero(mes, anio)
    return {"data": data, "total": len(data)}


@router.get("/contenido-popular")
def popular(limite: int = Query(10, ge=1, le=50)):
    """Contenido mas popular por reproducciones."""
    return contenido_popular(limite)


@router.get("/equipo")
def equipo():
    """Reporte de empleados por departamento."""
    return reporte_equipo()


@router.get("/moderacion")
def moderacion():
    """Estadisticas de moderacion."""
    return estadisticas_moderacion()
