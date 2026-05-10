"""Routers de usuarios: perfiles, favoritos, calificaciones, referidos."""

from fastapi import APIRouter, HTTPException

from database import get_connection, release_connection
from schemas.usuario import (
    Usuario, UsuarioUpdate, Perfil, PerfilCreate, PerfilUpdate,
    CambiarEstadoRequest,
)
from schemas.reproduccion import (
    Favorito, FavoritoCreate, Calificacion, CalificacionCreate,
)
from services.auth_service import obtener_usuario_por_id
from services.reproduccion_service import (
    agregar_favorito, eliminar_favorito, listar_favoritos,
    crear_calificacion, calificaciones_por_contenido,
    historial_reproducciones, reproducciones_en_progreso,
)

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/{id_usuario}", response_model=Usuario)
def obtener(id_usuario: int):
    """Obtiene un usuario por ID."""
    usuario = obtener_usuario_por_id(id_usuario)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.put("/{id_usuario}", response_model=Usuario)
def actualizar(id_usuario: int, data: UsuarioUpdate):
    """Actualiza datos de un usuario."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        updates = []
        binds = {"id": id_usuario}
        for field in ["nombre", "telefono", "ciudad", "id_plan"]:
            value = getattr(data, field, None)
            if value is not None:
                col = field
                updates.append(f"{col} = :{field}")
                binds[field] = value
        if updates:
            sql = f"UPDATE USUARIOS SET {', '.join(updates)} WHERE id_usuario = :id"
            cursor.execute(sql, binds)
            conn.commit()
        cursor.close()
        return obtener_usuario_por_id(id_usuario)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        release_connection(conn)


@router.put("/{id_usuario}/estado")
def cambiar_estado(id_usuario: int, data: CambiarEstadoRequest):
    """Cambia el estado de un usuario (ACTIVO/INACTIVO)."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE USUARIOS SET estado_cuenta = :1 WHERE id_usuario = :2",
            [data.estado, id_usuario]
        )
        if cursor.rowcount == 0:
            cursor.close()
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        conn.commit()
        cursor.close()
        return {"mensaje": f"Estado del usuario actualizado a {data.estado}"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        release_connection(conn)


# ==================== PERFILES ====================

@router.get("/{id_usuario}/perfiles", response_model=list[Perfil])
def obtener_perfiles(id_usuario: int):
    """Obtiene los perfiles de un usuario."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id_perfil, id_usuario, nombre_perfil, avatar, tipo FROM PERFILES WHERE id_usuario = :1 ORDER BY id_perfil",
            [id_usuario]
        )
        perfiles = [Perfil(id_perfil=r[0], id_usuario=r[1], nombre_perfil=r[2], avatar=r[3], tipo=r[4]) for r in cursor]
        cursor.close()
        return perfiles
    finally:
        release_connection(conn)


@router.post("/perfiles", response_model=Perfil, status_code=201)
def crear_perfil(data: PerfilCreate):
    """Crea un nuevo perfil."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO PERFILES (id_perfil, id_usuario, nombre_perfil, avatar, tipo)
               VALUES (seq_perfiles.NEXTVAL, :1, :2, :3, :4)
               RETURNING id_perfil INTO :5""",
            [data.id_usuario, data.nombre_perfil, data.avatar, data.tipo, cursor.var(int)]
        )
        id_perfil = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        return Perfil(id_perfil=id_perfil, id_usuario=data.id_usuario, nombre_perfil=data.nombre_perfil, avatar=data.avatar, tipo=data.tipo)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        release_connection(conn)


@router.put("/perfiles/{id_perfil}", response_model=Perfil)
def actualizar_perfil(id_perfil: int, data: PerfilUpdate):
    """Actualiza un perfil."""
    conn = get_connection()
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
            cursor.execute(f"UPDATE PERFILES SET {', '.join(updates)} WHERE id_perfil = :id", binds)
            conn.commit()
        cursor.close()

        cursor = conn.cursor()
        cursor.execute("SELECT id_perfil, id_usuario, nombre_perfil, avatar, tipo FROM PERFILES WHERE id_perfil = :1", [id_perfil])
        row = cursor.fetchone()
        cursor.close()
        if not row:
            raise HTTPException(status_code=404, detail="Perfil no encontrado")
        return Perfil(id_perfil=row[0], id_usuario=row[1], nombre_perfil=row[2], avatar=row[3], tipo=row[4])
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        release_connection(conn)


@router.delete("/perfiles/{id_perfil}")
def eliminar_perfil(id_perfil: int):
    """Elimina un perfil."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM PERFILES WHERE id_perfil = :1", [id_perfil])
        if cursor.rowcount == 0:
            cursor.close()
            raise HTTPException(status_code=404, detail="Perfil no encontrado")
        conn.commit()
        cursor.close()
        return {"mensaje": "Perfil eliminado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        release_connection(conn)


# ==================== FAVORITOS ====================

@router.get("/{id_usuario}/favoritos", response_model=list[Favorito])
def obtener_favoritos(id_perfil: int):
    """Obtiene los favoritos de un perfil."""
    return listar_favoritos(id_perfil)


@router.post("/favoritos", response_model=Favorito, status_code=201)
def agregar_favorito_endpoint(data: FavoritoCreate):
    """Agrega un contenido a favoritos."""
    try:
        return agregar_favorito(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/favoritos/{id_perfil}/{id_contenido}")
def eliminar_favorito_endpoint(id_perfil: int, id_contenido: int):
    """Elimina un contenido de favoritos."""
    if eliminar_favorito(id_perfil, id_contenido):
        return {"mensaje": "Favorito eliminado"}
    raise HTTPException(status_code=404, detail="Favorito no encontrado")


# ==================== CALIFICACIONES ====================

@router.post("/calificaciones", response_model=Calificacion, status_code=201)
def calificar(data: CalificacionCreate):
    """Crea o actualiza una calificacion."""
    try:
        return crear_calificacion(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/contenido/{id_contenido}/calificaciones", response_model=list[Calificacion])
def obtener_calificaciones(id_contenido: int):
    """Obtiene calificaciones de un contenido."""
    return calificaciones_por_contenido(id_contenido)


# ==================== HISTORIAL ====================

@router.get("/{id_usuario}/reproducciones", response_model=list)
def obtener_historial(id_perfil: int):
    """Obtiene historial de reproducciones de un perfil."""
    return historial_reproducciones(id_perfil)


@router.get("/{id_usuario}/reproducciones/en-progreso", response_model=list)
def obtener_en_progreso(id_perfil: int):
    """Obtiene reproducciones en progreso de un perfil."""
    return reproducciones_en_progreso(id_perfil)
