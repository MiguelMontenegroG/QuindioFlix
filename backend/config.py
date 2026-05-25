"""Configuracion centralizada usando variables de entorno."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Buscar el .env en la carpeta donde esta este archivo (backend/.env)
_env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)


def _required_env(var_name: str, fallback: str = "") -> str:
    """Retorna el valor de una variable de entorno o el fallback."""
    val = os.getenv(var_name)
    if val:
        return val
    return fallback


class Settings:
    # Oracle
    DB_USER: str = _required_env("DB_USER", "C##quindioflix")
    DB_PASS: str = _required_env("DB_PASS", _required_env("DB_PASSWORD", ""))
    DB_DSN: str = _required_env("DB_DSN", "localhost:1521/BD")
    _db_schema = os.getenv("DB_SCHEMA")
    DB_SCHEMA: str = _db_schema if _db_schema is not None else "C##QUINDIOFLIX"

    # Usuarios por rol (pooles separados)
    DB_USER_ADMIN: str = _required_env("DB_USER_ADMIN", "qf_admin")
    DB_PASS_ADMIN: str = _required_env("DB_PASS_ADMIN", "")
    DB_USER_ANALISTA: str = _required_env("DB_USER_ANALISTA", "qf_analista")
    DB_PASS_ANALISTA: str = _required_env("DB_PASS_ANALISTA", "")
    DB_USER_SOPORTE: str = _required_env("DB_USER_SOPORTE", "qf_soporte")
    DB_PASS_SOPORTE: str = _required_env("DB_PASS_SOPORTE", "")
    DB_USER_CONTENIDO: str = _required_env("DB_USER_CONTENIDO", "qf_contenido")
    DB_PASS_CONTENIDO: str = _required_env("DB_PASS_CONTENIDO", "")
    POOL_MIN: int = int(os.getenv("DB_POOL_MIN", "2"))
    POOL_MAX: int = int(os.getenv("DB_POOL_MAX", "10"))
    POOL_INC: int = int(os.getenv("DB_POOL_INC", "1"))

    # JWT
    SECRET_KEY: str = _required_env("SECRET_KEY", "quindioflix-secret-key-cambiame-en-produccion")
    ALGORITHM: str = _required_env("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # App
    APP_NAME: str = "QuindioFlix API"
    APP_VERSION: str = "1.0.0"
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in (os.getenv("CORS_ORIGINS") or "http://localhost:3000,http://localhost:3001").split(",")
        if origin.strip()
    ]


settings = Settings()
