"""Servicio para operaciones de usuario via SPs."""

import oracledb

from ..database import get_connection, release_connection, fq
from ..oracle_errors import handle_oracle_error


def eliminar_cuenta(id_usuario: int, confirmacion: str = "CONFIRMAR") -> None:
    """Elimina la cuenta usando SP_ELIMINAR_CUENTA."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.callproc(f"{fq('SP_ELIMINAR_CUENTA')}", [id_usuario, confirmacion])
        conn.commit()
        cursor.close()
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


def reporte_consumo(id_usuario: int, mes: int | None = None, anio: int | None = None) -> list[str]:
    """Ejecuta SP_REPORTE_CONSUMO y retorna las lineas de salida."""
    conn = get_connection("analista")
    try:
        cursor = conn.cursor()
        cursor.callproc("DBMS_OUTPUT.ENABLE")
        cursor.callproc(f"{fq('SP_REPORTE_CONSUMO')}", [id_usuario, mes, anio])

        line = cursor.var(str)
        status = cursor.var(int)
        output = []
        while True:
            cursor.callproc("DBMS_OUTPUT.GET_LINE", [line, status])
            if status.getvalue() != 0:
                break
            output.append(line.getvalue())

        cursor.close()
        return output
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "analista")

