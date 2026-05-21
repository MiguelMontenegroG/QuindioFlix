"""Routers de autenticacion: /login, /registro, /verificar."""

import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..auth import verify_token
from ..database import get_connection, release_connection, fq
from ..schemas.usuario import (
    UsuarioCreate, UsuarioLogin, LoginResponse, RegistroResponse,
    Usuario, Perfil,
)
from ..services.auth_service import registrar_usuario, autenticar_usuario, obtener_usuario_por_id

logger = logging.getLogger("auth.router")
router = APIRouter(prefix="/auth", tags=["Autenticacion"])
security = HTTPBearer()


@router.post("/registro", response_model=RegistroResponse)
async def registro(request: Request):
    """Registra un nuevo usuario en QuindioFlix."""
    try:
        body = await request.json()
        logger.info("Datos recibidos en registro: %s", body)
        data = UsuarioCreate(**body)
    except Exception as e:
        logger.error("Error validando datos de registro: %s", str(e))
        raise HTTPException(status_code=422, detail=f"Error de validacion: {str(e)}")

    usuario = registrar_usuario(data)
    return RegistroResponse(usuario=usuario, mensaje="Registro exitoso. Bienvenido a QuindioFlix!")


@router.post("/login", response_model=LoginResponse)
def login(data: UsuarioLogin):
    """Inicia sesion y retorna token JWT + datos del usuario."""
    token_data = autenticar_usuario(data)
    if not token_data:
        raise HTTPException(status_code=401, detail="Credenciales invalidas")
    return LoginResponse(
        token=token_data.token,
        usuario=token_data.usuario,
        perfiles=token_data.perfiles,
    )


@router.post("/logout")
def logout():
    """Logout logico para JWT (sin estado)."""
    return {"mensaje": "Sesion cerrada"}


@router.get("/verificar")
def verificar_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifica que el token JWT sea valido y retorna usuario + perfiles."""
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")

    usuario = obtener_usuario_por_id(int(payload["sub"]))
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT id_perfil, id_usuario, nombre_perfil, avatar, tipo
               FROM {fq('PERFILES')} WHERE id_usuario = :1""", [usuario.id_usuario]
        )
        perfiles = [
            Perfil(
                id_perfil=r[0], id_usuario=r[1],
                nombre_perfil=r[2], avatar=r[3], tipo=r[4]
            ) for r in cursor
        ]
        cursor.close()
    finally:
        release_connection(conn, "admin")

    return {"usuario": usuario, "perfiles": perfiles}
