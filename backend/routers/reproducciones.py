"""Routers de reproducciones: registrar, actualizar avance, historial."""

from fastapi import APIRouter, HTTPException

from schemas.reproduccion import (
    Reproduccion, ReproduccionCreate, ReproduccionUpdate,
)
from services.reproduccion_service import (
    registrar_reproduccion, actualizar_avance,
    historial_reproducciones, reproducciones_en_progreso,
)

router = APIRouter(prefix="/reproducciones", tags=["Reproducciones"])


@router.post("", response_model=Reproduccion, status_code=201)
def crear(data: ReproduccionCreate):
    """Registra una nueva reproduccion."""
    try:
        return registrar_reproduccion(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{id_reproduccion}", response_model=Reproduccion)
def actualizar(id_reproduccion: int, data: ReproduccionUpdate):
    """Actualiza el porcentaje de avance de una reproduccion."""
    rep = actualizar_avance(id_reproduccion, data)
    if not rep:
        raise HTTPException(status_code=404, detail="Reproduccion no encontrada")
    return rep
