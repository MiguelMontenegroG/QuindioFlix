"""Configuracion centralizada usando variables de entorno."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Buscar el .env en la carpeta donde esta este archivo (backend/.env)
_env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)
class Settings:
    # Oracle
    DB_USER: str = os.getenv("DB_USER") or os.getenv("DB_USER_FILE") or "C##quindioflix"
    DB_PASS: str = os.getenv("DB_PASS") or os.getenv("DB_PASSWORD") or "quindioflix"
    DB_DSN: str = os.getenv("DB_DSN") or "localhost:1521/BD"
    _db_schema = os.getenv("DB_SCHEMA")
    DB_SCHEMA: str = _db_schema if _db_schema is not None else "QUINDIOFLIX"

    # Usuarios por rol (pooles separados)
    DB_USER_ADMIN: str = os.getenv("DB_USER_ADMIN") or os.getenv("DB_USER") or "qf_admin"
    DB_PASS_ADMIN: str = os.getenv("DB_PASS_ADMIN") or os.getenv("DB_PASSWORD") or os.getenv("DB_PASS") or ""

    DB_USER_ANALISTA: str = os.getenv("DB_USER_ANALISTA") or "qf_analista"
    DB_PASS_ANALISTA: str = os.getenv("DB_PASS_ANALISTA") or os.getenv("DB_PASSWORD") or os.getenv("DB_PASS") or ""

    DB_USER_SOPORTE: str = os.getenv("DB_USER_SOPORTE") or "qf_soporte"
    DB_PASS_SOPORTE: str = os.getenv("DB_PASS_SOPORTE") or os.getenv("DB_PASSWORD") or os.getenv("DB_PASS") or ""

    DB_USER_CONTENIDO: str = os.getenv("DB_USER_CONTENIDO") or "qf_contenido"
    DB_PASS_CONTENIDO: str = os.getenv("DB_PASS_CONTENIDO") or os.getenv("DB_PASSWORD") or os.getenv("DB_PASS") or ""

    POOL_MIN: int = int(os.getenv("DB_POOL_MIN", "2"))
    POOL_MAX: int = int(os.getenv("DB_POOL_MAX", "10"))
    POOL_INC: int = int(os.getenv("DB_POOL_INC", "1"))

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "quindioflix-secret-key-cambiame-en-produccion")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
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
