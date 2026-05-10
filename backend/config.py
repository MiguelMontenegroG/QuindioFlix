"""Configuracion centralizada usando variables de entorno."""

import os
from dotenv import load_dotenv

# Cargar .env pero NO sobrescribir variables que ya existen en el entorno
load_dotenv(override=False)


class Settings:
    # Oracle
    DB_USER: str = os.getenv("DB_USER") or os.getenv("DB_USER_FILE") or "C##quindioflix"
    DB_PASS: str = os.getenv("DB_PASS") or os.getenv("DB_PASSWORD") or "quindioflix"
    DB_DSN: str = os.getenv("DB_DSN") or "localhost:1521/BD"

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "quindioflix-secret-key-cambiame-en-produccion")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # App
    APP_NAME: str = "QuindioFlix API"
    APP_VERSION: str = "1.0.0"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]


settings = Settings()
