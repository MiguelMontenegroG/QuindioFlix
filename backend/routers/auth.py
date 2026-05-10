"""Routers de autenticacion: /login, /registro, /verificar."""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from auth import verify_token
from schemas.usuario import (
    UsuarioCreate, UsuarioLogin, LoginResponse, RegistroResponse,
    Usuario, Perfil,
)
from services.auth_service import registrar_usuario, autenticar_usuario, obtener_usuario_por_id

router = APIRouter(prefix="/auth", tags=["Autenticacion"])
security = HTTPBearer()


@router.post("/registro", response_model=RegistroResponse)
def registro(data: UsuarioCreate):
    """Registra un nuevo usuario en QuindioFlix."""
    try:
        usuario = registrar_usuario(data)
        return RegistroResponse(usuario=usuario, mensaje="Registro exitoso. Bienvenido a QuindioFlix!")
    except Exception as e:
        error_msg = str(e)
        if "UK" in error_msg or "UNIQUE" in error_msg or "uq_usu_email" in error_msg:
            raise HTTPException(status_code=409, detail="El email ya esta registrado")
        raise HTTPException(status_code=400, detail=error_msg)


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


@router.get("/verificar")
def verificar_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifica que el token JWT sea valido y retorna usuario + perfiles."""
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")

    from services.auth_service import obtener_usuario_por_id
    usuario = obtener_usuario_por_id(int(payload["sub"]))
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Obtener perfiles del usuario
    from database import get_connection, release_connection
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT id_perfil, id_usuario, nombre_perfil, avatar, tipo
               FROM PERFILES WHERE id_usuario = :1""", [usuario.id_usuario]
        )
        perfiles = []
        for r in cursor:
            from schemas.usuario import Perfil
            perfiles.append(Perfil(
                id_perfil=r[0], id_usuario=r[1],
                nombre_perfil=r[2], avatar=r[3], tipo=r[4]
            ))
        cursor.close()
    finally:
        release_connection(conn)

    return {"usuario": usuario, "perfiles": perfiles}
