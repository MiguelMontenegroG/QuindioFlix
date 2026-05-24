"""Routers de perfiles: actualizar, eliminar, historial y favoritos."""

import oracledb
from fastapi import APIRouter, HTTPException, Query

from backend.database import get_connection, release_connection, fq
from backend.oracle_errors import handle_oracle_error
from backend.schemas.usuario import Perfil, PerfilUpdate
from backend.schemas.reproduccion import Favorito, Reproduccion
from backend.services.reproduccion_service import listar_favoritos, historial_reproducciones, reproducciones_en_progreso

router = APIRouter(prefix="/perfiles", tags=["Perfiles"])


@router.put("/{id_perfil}", response_model=Perfil)
def actualizar_perfil(id_perfil: int, data: PerfilUpdate):
    """Actualiza un perfil."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        updates = []
        binds = {"id": id_perfil}
        for field in ["nombre_perfil", "avatar", "tipo"]:
            value = getattr(data, field, None)
            if value is not None:
                updates.append(f"{field} = :{field}")
                binds[field] = value
        if updates:
            cursor.execute(f"UPDATE {fq('PERFILES')} SET {', '.join(updates)} WHERE id_perfil = :id", binds)
            conn.commit()
        cursor.close()

        cursor = conn.cursor()
        cursor.execute(
            f"SELECT id_perfil, id_usuario, nombre_perfil, avatar, tipo FROM {fq('PERFILES')} WHERE id_perfil = :1",
            [id_perfil]
        )
        row = cursor.fetchone()
        cursor.close()
        if not row:
            raise HTTPException(status_code=404, detail="Perfil no encontrado")
        return Perfil(id_perfil=row[0], id_usuario=row[1], nombre_perfil=row[2], avatar=row[3], tipo=row[4])
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


@router.delete("/{id_perfil}")
def eliminar_perfil(id_perfil: int):
    """Elimina un perfil y todos sus datos asociados (favoritos, historial)."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        # Eliminar registros asociados primero (FK)
        cursor.execute(f"DELETE FROM {fq('FAVORITOS')} WHERE id_perfil = :1", [id_perfil])
        cursor.execute(f"DELETE FROM {fq('REPRODUCCIONES')} WHERE id_perfil = :1", [id_perfil])
        cursor.execute(f"DELETE FROM {fq('CALIFICACIONES')} WHERE id_perfil = :1", [id_perfil])
        cursor.execute(f"DELETE FROM {fq('REPORTES_CONTENIDO')} WHERE id_perfil_reportador = :1", [id_perfil])
        # Finalmente eliminar el perfil
        cursor.execute(f"DELETE FROM {fq('PERFILES')} WHERE id_perfil = :1", [id_perfil])
        if cursor.rowcount == 0:
            cursor.close()
            raise HTTPException(status_code=404, detail="Perfil no encontrado")
        conn.commit()
        cursor.close()
        return {"mensaje": "Perfil y todos sus datos asociados eliminados exitosamente"}
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


@router.get("/{id_perfil}/favoritos", response_model=list[Favorito])
def obtener_favoritos(id_perfil: int, page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100)):
    """Obtiene los favoritos de un perfil."""
    offset = (page - 1) * size
    return listar_favoritos(id_perfil, offset=offset, limit=size)


@router.get("/{id_perfil}/historial", response_model=list[Reproduccion])
def obtener_historial(id_perfil: int, page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100)):
    """Obtiene historial de reproducciones de un perfil."""
    offset = (page - 1) * size
    return historial_reproducciones(id_perfil, offset=offset, limit=size)


@router.get("/{id_perfil}/historial/en-progreso", response_model=list[Reproduccion])
def obtener_en_progreso(id_perfil: int, page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100)):
    """Obtiene reproducciones en progreso de un perfil."""
    offset = (page - 1) * size
    return reproducciones_en_progreso(id_perfil, offset=offset, limit=size)

