"""Modelos Pydantic para Contenido, Categorias, Generos, Temporadas y Episodios."""

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


# ==================== CATEGORIAS ====================
class CategoriaBase(BaseModel):
    nombre_categoria: str = Field(..., max_length=50)
    descripcion: Optional[str] = Field(None, max_length=255)


class Categoria(CategoriaBase):
    id_categoria: int

    class Config:
        from_attributes = True


# ==================== GENEROS ====================
class GeneroBase(BaseModel):
    nombre_genero: str = Field(..., max_length=50)


class Genero(GeneroBase):
    id_genero: int

    class Config:
        from_attributes = True


# ==================== CONTENIDO ====================
class ContenidoBase(BaseModel):
    titulo: str = Field(..., max_length=200)
    anio_lanzamiento: int = Field(..., ge=1888, le=2100)
    duracion: int = Field(..., gt=0)  # en segundos
    sinopsis: Optional[str] = None
    clasificacion_edad: str = Field(..., pattern=r"^(TP|\+7|\+13|\+16|\+18)$")
    es_original: str = Field(default="N", pattern=r"^[SN]$")
    id_categoria: int
    id_empleado_resp: int = Field(default=4, description="FK a EMPLEADOS (default: Directora de Contenido)")
    poster_url: Optional[str] = Field(None, max_length=500)
    banner_url: Optional[str] = Field(None, max_length=500)


class ContenidoCreate(ContenidoBase):
    generos: list[int] = []  # IDs de generos


class ContenidoUpdate(BaseModel):
    titulo: Optional[str] = Field(None, max_length=200)
    anio_lanzamiento: Optional[int] = Field(None, ge=1888, le=2100)
    duracion: Optional[int] = Field(None, gt=0)
    sinopsis: Optional[str] = None
    clasificacion_edad: Optional[str] = Field(None, pattern=r"^(TP|\+7|\+13|\+16|\+18)$")
    es_original: Optional[str] = Field(None, pattern=r"^[SN]$")
    id_categoria: Optional[int] = None
    id_empleado_resp: Optional[int] = None
    generos: Optional[list[int]] = None
    poster_url: Optional[str] = Field(None, max_length=500)
    banner_url: Optional[str] = Field(None, max_length=500)


class Contenido(ContenidoBase):
    id_contenido: int
    fecha_agregado: date
    categoria: Optional[Categoria] = None
    generos: list[Genero] = []
    calificacion_promedio: Optional[float] = None
    temporadas: list["Temporada"] = []

    class Config:
        from_attributes = True


class ContenidoRelacionadoBase(BaseModel):
    id_contenido_b: int
    tipo_relacion: str = Field(..., pattern=r"^(SECUELA|PRECUELA|REMAKE|SPIN_OFF|VERSION_EXTENDIDA|OTRO)$")
    descripcion: Optional[str] = Field(None, max_length=300)


class ContenidoRelacionado(ContenidoRelacionadoBase):
    id_contenido_a: int
    contenido_b: Optional[Contenido] = None


# ==================== TEMPORADAS ====================
class TemporadaBase(BaseModel):
    id_contenido: int
    numero_temporada: int = Field(..., gt=0)
    titulo_temporada: Optional[str] = Field(None, max_length=200)
    anio: Optional[int] = Field(None, ge=1888, le=2100)


class TemporadaCreate(TemporadaBase):
    pass


class TemporadaUpdate(BaseModel):
    titulo_temporada: Optional[str] = Field(None, max_length=200)
    anio: Optional[int] = Field(None, ge=1888, le=2100)


class Temporada(TemporadaBase):
    id_temporada: int
    episodios: list["Episodio"] = []

    class Config:
        from_attributes = True


# ==================== EPISODIOS ====================
class EpisodioBase(BaseModel):
    id_temporada: int
    numero_episodio: int = Field(..., gt=0)
    titulo_episodio: str = Field(..., max_length=200)
    duracion: int = Field(..., gt=0)  # en segundos
    sinopsis_ep: Optional[str] = None


class EpisodioCreate(EpisodioBase):
    pass


class EpisodioUpdate(BaseModel):
    titulo_episodio: Optional[str] = Field(None, max_length=200)
    duracion: Optional[int] = Field(None, gt=0)
    sinopsis_ep: Optional[str] = None


class Episodio(EpisodioBase):
    id_episodio: int

    class Config:
        from_attributes = True


# ==================== BUSQUEDA ====================
class BusquedaParams(BaseModel):
    q: str = ""
    categoria: Optional[int] = None
    genero: Optional[int] = None
    anio: Optional[int] = None
    clasificacion: Optional[str] = None
    pagina: int = Field(default=1, ge=1)
    por_pagina: int = Field(default=20, ge=1, le=100)
