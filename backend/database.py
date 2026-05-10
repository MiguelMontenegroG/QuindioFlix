"""Pool de conexiones Oracle usando oracledb en modo thin."""

import oracledb
from config import settings

pool: oracledb.ConnectionPool | None = None


def init_pool():
    """Inicializa el pool de conexiones a Oracle."""
    global pool
    pool = oracledb.create_pool(
        user=settings.DB_USER,
        password=settings.DB_PASS,
        dsn=settings.DB_DSN,
        min=2,
        max=10,
        increment=1,
    )
    return pool


def get_connection():
    """Obtiene una conexion del pool."""
    if pool is None:
        init_pool()
    return pool.acquire()


def release_connection(conn):
    """Devuelve la conexion al pool."""
    if pool and conn:
        pool.release(conn)


def close_pool():
    """Cierra todas las conexiones del pool."""
    global pool
    if pool:
        pool.close()
        pool = None
