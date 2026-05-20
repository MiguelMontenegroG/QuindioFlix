"""Dependencias FastAPI para proteccion de rutas.

- get_current_user: verifica token JWT y retorna datos del usuario
- require_roles: valida roles del JWT
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .auth import verify_token
from .services.auth_service import obtener_usuario_por_id
from .schemas.usuario import Usuario

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Usuario:
    """Verifica el token JWT y retorna el usuario autenticado."""
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = int(payload.get("sub"))
    usuario = obtener_usuario_por_id(user_id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    return usuario


def require_roles(*roles: str):
    """Dependencia que valida que el JWT tenga un rol permitido."""
    async def _checker(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Usuario:
        payload = verify_token(credentials.credentials)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalido o expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )

        role = payload.get("role")
        if role not in roles and role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para esta operacion",
            )

        user_id = int(payload.get("sub"))
        usuario = obtener_usuario_por_id(user_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        return usuario

    return _checker
