"""Routers de favoritos."""

from fastapi import APIRouter, HTTPException

from backend.schemas.reproduccion import Favorito, FavoritoCreate
from backend.services.reproduccion_service import agregar_favorito, eliminar_favorito

router = APIRouter(prefix="/favoritos", tags=["Favoritos"])


@router.post("", response_model=Favorito, status_code=201)
def agregar_favorito_endpoint(data: FavoritoCreate):
    """Agrega un contenido a favoritos."""
    return agregar_favorito(data)


@router.delete("/{id_perfil}/{id_contenido}")
def eliminar_favorito_endpoint(id_perfil: int, id_contenido: int):
    """Elimina un contenido de favoritos."""
    if eliminar_favorito(id_perfil, id_contenido):
        return {"mensaje": "Favorito eliminado"}
    raise HTTPException(status_code=404, detail="Favorito no encontrado")

