"""Pool de conexiones Oracle usando oracledb en modo thin."""

import oracledb
from .config import settings

POOLS: dict[str, oracledb.ConnectionPool] = {}
ROLE_USERS = {
    "admin": (settings.DB_USER_ADMIN, settings.DB_PASS_ADMIN),
    "analista": (settings.DB_USER_ANALISTA, settings.DB_PASS_ANALISTA),
    "soporte": (settings.DB_USER_SOPORTE, settings.DB_PASS_SOPORTE),
    "contenido": (settings.DB_USER_CONTENIDO, settings.DB_PASS_CONTENIDO),
}

# Usuario principal por defecto
_DEFAULT_USER = settings.DB_USER
_DEFAULT_PASS = settings.DB_PASS


def _get_credentials(role: str) -> tuple[str, str]:
    """Obtiene credenciales para un rol, con fallback al usuario principal."""
    user, password = ROLE_USERS[role]
    # Si no hay password o el usuario es qf_* (no creado en BD), usar el principal
    if not password or user.startswith("qf_"):
        return (_DEFAULT_USER, _DEFAULT_PASS)
    return (user, password)


def _create_pool(role: str) -> oracledb.ConnectionPool:
    """Crea un pool por rol si no existe."""
    user, password = _get_credentials(role)
    return oracledb.create_pool(
        user=user,
        password=password,
        dsn=settings.DB_DSN,
        min=settings.POOL_MIN,
        max=settings.POOL_MAX,
        increment=settings.POOL_INC,
    )


def init_pools() -> None:
    """Inicializa pools para todos los roles configurados."""
    for role in ROLE_USERS:
        if role not in POOLS:
            POOLS[role] = _create_pool(role)


def get_connection(role: str = "admin"):
    """Obtiene una conexion del pool del rol especificado."""
    if role not in POOLS:
        POOLS[role] = _create_pool(role)
    return POOLS[role].acquire()


def release_connection(conn, role: str = "admin"):
    """Devuelve la conexion al pool correspondiente."""
    pool = POOLS.get(role)
    if pool and conn:
        pool.release(conn)


def close_pools() -> None:
    """Cierra todas las conexiones de todos los pools."""
    for pool in POOLS.values():
        pool.close()
    POOLS.clear()


def fq(name: str) -> str:
    """Devuelve el nombre con prefijo de esquema si aplica."""
    if settings.DB_SCHEMA:
        return f"{settings.DB_SCHEMA}.{name}"
    return name
