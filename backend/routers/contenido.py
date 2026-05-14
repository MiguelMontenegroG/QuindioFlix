"""Routers de contenido: catalogo, busqueda, temporadas, episodios."""

from fastapi import APIRouter, HTTPException, Query, Depends

from ..dependencies import require_roles
from ..schemas.contenido import (
    BusquedaParams, Contenido, ContenidoCreate, ContenidoUpdate,
    Temporada, TemporadaCreate, TemporadaUpdate,
    Episodio, EpisodioCreate, EpisodioUpdate,
    Categoria, Genero,
)
from ..schemas.reproduccion import Calificacion
from ..services.contenido_service import (
    listar_contenido, obtener_contenido_por_id,
    crear_contenido, actualizar_contenido, eliminar_contenido,
    listar_temporadas, crear_temporada, crear_episodio,
    listar_categorias, listar_generos, contenido_recomendado,
)
from ..services.reproduccion_service import calificaciones_por_contenido

router = APIRouter(prefix="/contenido", tags=["Contenido"])


@router.get("")
def listar(
    q: str = Query("", description="Busqueda por titulo"),
    categoria: int = Query(None, description="ID de categoria"),
    genero: int = Query(None, description="ID de genero"),
    anio: int = Query(None, description="Anio de lanzamiento"),
    clasificacion: str = Query(None, description="Clasificacion TP, +7, +13, +16, +18"),
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
):
    """Lista el catalogo de contenido con filtros y paginacion."""
    params = BusquedaParams(
        q=q, categoria=categoria, genero=genero,
        anio=anio, clasificacion=clasificacion,
        pagina=pagina, por_pagina=por_pagina
    )
    items, total = listar_contenido(params)
    return {"data": items, "total": total, "pagina": pagina, "por_pagina": por_pagina}


@router.get("/{id_contenido}", response_model=Contenido)
def obtener(id_contenido: int):
    """Obtiene un contenido por su ID con generos y categoria."""
    contenido = obtener_contenido_por_id(id_contenido)
    if not contenido:
        raise HTTPException(status_code=404, detail="Contenido no encontrado")
    return contenido


@router.post("", response_model=Contenido, status_code=201, dependencies=[Depends(require_roles("contenido"))])
def crear(data: ContenidoCreate):
    """Crea un nuevo contenido en el catalogo."""
    return crear_contenido(data)


@router.put("/{id_contenido}", response_model=Contenido, dependencies=[Depends(require_roles("contenido"))])
def actualizar(id_contenido: int, data: ContenidoUpdate):
    """Actualiza un contenido existente."""
    contenido = actualizar_contenido(id_contenido, data)
    if not contenido:
        raise HTTPException(status_code=404, detail="Contenido no encontrado")
    return contenido


@router.delete("/{id_contenido}", dependencies=[Depends(require_roles("contenido"))])
def eliminar(id_contenido: int):
    """Elimina un contenido del catalogo."""
    if eliminar_contenido(id_contenido):
        return {"mensaje": "Contenido eliminado exitosamente"}
    raise HTTPException(status_code=404, detail="Contenido no encontrado")


@router.get("/{id_contenido}/temporadas", response_model=list[Temporada])
def obtener_temporadas(id_contenido: int):
    """Obtiene las temporadas de un contenido."""
    return listar_temporadas(id_contenido)


@router.get("/{id_contenido}/calificaciones", response_model=list[Calificacion])
def obtener_calificaciones(id_contenido: int, page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100)):
    """Obtiene calificaciones de un contenido."""
    offset = (page - 1) * size
    return calificaciones_por_contenido(id_contenido, offset=offset, limit=size)


@router.get("/recomendado/{id_perfil}", response_model=Contenido | None)
def recomendado(id_perfil: int):
    """Obtiene el contenido recomendado para un perfil."""
    return contenido_recomendado(id_perfil)


# ==================== CATEGORIAS Y GENEROS ====================

@router.get("/categorias/all", response_model=list[Categoria])
def listar_categorias_endpoint():
    """Lista todas las categorias disponibles."""
    return listar_categorias()


@router.get("/generos/all", response_model=list[Genero])
def listar_generos_endpoint():
    """Lista todos los generos disponibles."""
    return listar_generos()


# ==================== RUTAS ADICIONALES (buscar, recomendados) ====================

@router.get("/buscar/all")
def buscar(q: str = Query("", min_length=1)):
    """Busca contenido por titulo."""
    params = BusquedaParams(q=q, por_pagina=50)
    items, total = listar_contenido(params)
    return {"data": items, "total": total}
