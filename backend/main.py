"""QuindioFlix API - FastAPI Backend.

Arquitectura:
- main.py: app FastAPI + CORS + registro de routers
- database.py: pool de conexiones Oracle
- auth.py: JWT creation y verificación
- schemas/: modelos Pydantic
- routers/: endpoints HTTP
- services/: lógica de negocio que llama a Oracle
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_pools, close_pools

# Importar routers
from .routers import (
    auth,
    contenido,
    reproducciones,
    usuarios,
    pagos,
    reportes_mod,
    analitica,
    admin,
    dba,
    setup,
    perfiles,
    favoritos,
    calificaciones,
    monitor_router,  # <-- NUEVO: monitor en tiempo real
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Maneja el ciclo de vida de la aplicacion."""
    # Startup: inicializar pool de conexiones Oracle
    try:
        init_pools()
        print(f"[{settings.APP_NAME}] Pools Oracle inicializados en {settings.DB_DSN}")
    except Exception as e:
        print(f"[{settings.APP_NAME}] WARNING: No se pudo conectar a Oracle: {e}")
        print(f"[{settings.APP_NAME}] La API iniciara sin base de datos. Configure backend/.env")
    yield
    # Shutdown: cerrar pool
    try:
        close_pools()
        print(f"[{settings.APP_NAME}] Conexiones Oracle cerradas")
    except Exception:
        pass


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend de QuindioFlix - Streaming colombiano con sabor a cafe",
    lifespan=lifespan,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth.router)
app.include_router(contenido.router)
app.include_router(reproducciones.router)
app.include_router(usuarios.router)
app.include_router(perfiles.router)
app.include_router(favoritos.router)
app.include_router(calificaciones.router)
app.include_router(pagos.router)
app.include_router(reportes_mod.router)
app.include_router(analitica.router)
app.include_router(admin.router)
app.include_router(dba.router)
app.include_router(setup.router)
app.include_router(monitor_router)  # <-- NUEVO


@app.get("/")
def root():
    """Endpoint raiz de bienvenida."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    """Health check que verifica conexion a Oracle."""
    try:
        from .database import get_connection, release_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM DUAL")
        cursor.close()
        release_connection(conn)
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}
