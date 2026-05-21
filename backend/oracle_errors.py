"""Manejo de errores Oracle y mapeo a HTTPException."""

import oracledb
from fastapi import HTTPException

ORACLE_ERROR_MAP: dict[int, tuple[int, str]] = {
    20001: (400, "El email ya esta registrado"),
    20002: (400, "Limite de perfiles alcanzado para este plan"),
    20003: (403, "Cuenta inactiva o contenido no permitido para el perfil"),
    20004: (403, "Debe ver al menos el 50% del contenido para calificarlo"),
    20005: (400, "Error de validacion de datos"),
    20006: (404, "Plan no encontrado"),
    1: (409, "Registro duplicado"),
    2291: (404, "Referencia no encontrada"),
    2292: (409, "Existen registros dependientes"),
}


def handle_oracle_error(e: oracledb.DatabaseError) -> None:
    """Convierte errores Oracle a HTTPException segun el mapa definido."""
    error, = e.args
    code = getattr(error, "code", None)
    message = getattr(error, "message", str(e))

    print(f"[Oracle Error] Code={code}, Message={message}")  # LOG para depuracion

    if code in ORACLE_ERROR_MAP:
        http_code, detail = ORACLE_ERROR_MAP[code]
        raise HTTPException(status_code=http_code, detail=f"{detail} (ORA-{code})")

    raise HTTPException(status_code=500, detail=f"Error de BD (ORA-{code}): {message}")
