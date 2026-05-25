"""Modelos Pydantic para Reportes de contenido."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class ReporteCreate(BaseModel):
    id_perfil_reportador: int
    id_contenido: int
    motivo: str = Field(..., max_length=300)
    descripcion: Optional[str] = Field(None, max_length=500)


class ResolverReporte(BaseModel):
    estado: str = Field(..., pattern=r"^(EN_REVISION|RESUELTO|RECHAZADO)$")
    comentario_moderador: Optional[str] = Field(None, max_length=500)


class Reporte(BaseModel):
    id_reporte: int
    id_perfil_reportador: int
    id_contenido: int
    motivo: str
    descripcion: Optional[str] = None
    fecha_reporte: date
    estado_reporte: str = "PENDIENTE"
    id_moderador: Optional[int] = None
    fecha_resolucion: Optional[date] = None
    comentario_moderador: Optional[str] = None
    nombre_reportador: Optional[str] = None
    titulo_contenido: Optional[str] = None

    class Config:
        from_attributes = True