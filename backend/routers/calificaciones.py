"""Routers de calificaciones."""

from fastapi import APIRouter, HTTPException

from backend.schemas.reproduccion import Calificacion, CalificacionCreate, CalificacionUpdate
from backend.services.reproduccion_service import crear_calificacion, actualizar_calificacion, eliminar_calificacion

router = APIRouter(prefix="/calificaciones", tags=["Calificaciones"])


@router.post("", response_model=Calificacion, status_code=201)
def crear_calificacion_endpoint(data: CalificacionCreate):
    """Crea o actualiza una calificacion."""
    return crear_calificacion(data)


@router.put("/{id_calificacion}", response_model=Calificacion)
def actualizar_calificacion_endpoint(id_calificacion: int, data: CalificacionUpdate):
    """Actualiza una calificacion por ID."""
    cal = actualizar_calificacion(id_calificacion, data.estrellas, data.resenia)
    if not cal:
        raise HTTPException(status_code=404, detail="Calificacion no encontrada")
    return cal


@router.delete("/{id_calificacion}")
def eliminar_calificacion_endpoint(id_calificacion: int):
    """Elimina una calificacion por ID."""
    if eliminar_calificacion(id_calificacion):
        return {"mensaje": "Calificacion eliminada"}
    raise HTTPException(status_code=404, detail="Calificacion no encontrada")

