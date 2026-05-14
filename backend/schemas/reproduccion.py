"""Modelos Pydantic para Reproducciones, Favoritos y Calificaciones."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ==================== REPRODUCCIONES ====================
class ReproduccionBase(BaseModel):
    id_perfil: int
    id_contenido: int
    id_episodio: Optional[int] = None
    dispositivo: str = Field(..., pattern=r"^(CELULAR|TABLET|TV|COMPUTADOR)$")


class ReproduccionCreate(ReproduccionBase):
    pass


class ReproduccionUpdate(BaseModel):
    porcentaje_avance: float = Field(..., ge=0, le=100)
    fecha_fin: Optional[datetime] = None


class Reproduccion(ReproduccionBase):
    id_reproduccion: int
    fecha_hora_inicio: datetime
    fecha_hora_fin: Optional[datetime] = None
    porcentaje_avance: float = 0

    class Config:
        from_attributes = True


# ==================== FAVORITOS ====================
class FavoritoCreate(BaseModel):
    id_perfil: int
    id_contenido: int


class Favorito(BaseModel):
    id_perfil: int
    id_contenido: int
    fecha_agregado: datetime

    class Config:
        from_attributes = True


# ==================== CALIFICACIONES ====================
class CalificacionCreate(BaseModel):
    id_perfil: int
    id_contenido: int
    estrellas: int = Field(..., ge=1, le=5)
    resenia: Optional[str] = None


class CalificacionUpdate(BaseModel):
    estrellas: int = Field(..., ge=1, le=5)
    resenia: Optional[str] = None


class Calificacion(BaseModel):
    id_calificacion: int
    id_perfil: int
    id_contenido: int
    estrellas: int
    resenia: Optional[str] = None
    fecha_calificacion: datetime

    class Config:
        from_attributes = True
