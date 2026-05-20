"""Servicio para Reproducciones, Favoritos y Calificaciones."""

from datetime import datetime, timezone
from typing import Optional

import oracledb

from ..database import get_connection, release_connection, fq
from ..oracle_errors import handle_oracle_error
from ..schemas.reproduccion import (
    Reproduccion, ReproduccionCreate, ReproduccionUpdate,
    Favorito, FavoritoCreate, Calificacion, CalificacionCreate,
)


def _read_clob(val):
    if val is None:
        return None
    if hasattr(val, "read"):
        return val.read()
    return str(val)


def registrar_reproduccion(data: ReproduccionCreate) -> Reproduccion:
    """Registra una nueva reproduccion."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc)
        cursor.execute(
            f"""INSERT INTO {fq('REPRODUCCIONES')} (id_reproduccion, id_perfil, id_contenido,
               id_episodio, fecha_hora_inicio, dispositivo, porcentaje_avance)
               VALUES (seq_reproducciones.NEXTVAL, :1, :2, :3, :4, :5, 0)
               RETURNING id_reproduccion, fecha_hora_inicio INTO :6, :7""",
            [data.id_perfil, data.id_contenido, data.id_episodio,
             now, data.dispositivo,
             cursor.var(int), cursor.var(str)]
        )
        id_rep, fecha_ini = cursor.fetchone()
        conn.commit()
        cursor.close()

        return Reproduccion(
            id_reproduccion=id_rep, id_perfil=data.id_perfil,
            id_contenido=data.id_contenido, id_episodio=data.id_episodio,
            fecha_hora_inicio=fecha_ini, dispositivo=data.dispositivo,
            porcentaje_avance=0
        )
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


def actualizar_avance(id_reproduccion: int, data: ReproduccionUpdate) -> Reproduccion | None:
    """Actualiza el porcentaje de avance y opcionalmente la fecha de fin."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        binds = {
            "porcentaje_avance": data.porcentaje_avance,
            "fecha_fin": data.fecha_fin,
            "id": id_reproduccion,
        }

        sql = f"UPDATE {fq('REPRODUCCIONES')} SET porcentaje_avance = :porcentaje_avance"
        if data.fecha_fin:
            sql += ", fecha_hora_fin = :fecha_fin"
        sql += " WHERE id_reproduccion = :id"

        cursor.execute(sql, binds)
        conn.commit()
        cursor.close()

        return obtener_reproduccion(id_reproduccion)
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


def obtener_reproduccion(id_reproduccion: int) -> Reproduccion | None:
    """Obtiene una reproduccion por ID."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT id_reproduccion, id_perfil, id_contenido, id_episodio,
                      fecha_hora_inicio, fecha_hora_fin, dispositivo, porcentaje_avance
               FROM {fq('REPRODUCCIONES')} WHERE id_reproduccion = :1""", [id_reproduccion]
        )
        row = cursor.fetchone()
        cursor.close()
        if not row:
            return None
        return Reproduccion(
            id_reproduccion=row[0], id_perfil=row[1],
            id_contenido=row[2], id_episodio=row[3],
            fecha_hora_inicio=row[4], fecha_hora_fin=row[5],
            dispositivo=row[6], porcentaje_avance=row[7]
        )
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


def historial_reproducciones(id_perfil: int, offset: int = 0, limit: int = 20) -> list[Reproduccion]:
    """Obtiene el historial de reproducciones de un perfil."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT id_reproduccion, id_perfil, id_contenido, id_episodio,
                      fecha_hora_inicio, fecha_hora_fin, dispositivo, porcentaje_avance
               FROM {fq('REPRODUCCIONES')}
               WHERE id_perfil = :1
               ORDER BY fecha_hora_inicio DESC
               OFFSET :2 ROWS FETCH NEXT :3 ROWS ONLY""",
            [id_perfil, offset, limit]
        )
        result = [Reproduccion(
            id_reproduccion=r[0], id_perfil=r[1], id_contenido=r[2],
            id_episodio=r[3], fecha_hora_inicio=r[4], fecha_hora_fin=r[5],
            dispositivo=r[6], porcentaje_avance=r[7]
        ) for r in cursor]
        cursor.close()
        return result
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


def reproducciones_en_progreso(id_perfil: int, offset: int = 0, limit: int = 20) -> list[Reproduccion]:
    """Obtiene reproducciones con avance > 0 y < 100."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT id_reproduccion, id_perfil, id_contenido, id_episodio,
                      fecha_hora_inicio, fecha_hora_fin, dispositivo, porcentaje_avance
               FROM {fq('REPRODUCCIONES')}
               WHERE id_perfil = :1 AND porcentaje_avance > 0 AND porcentaje_avance < 100
               ORDER BY fecha_hora_inicio DESC
               OFFSET :2 ROWS FETCH NEXT :3 ROWS ONLY""",
            [id_perfil, offset, limit]
        )
        result = [Reproduccion(
            id_reproduccion=r[0], id_perfil=r[1], id_contenido=r[2],
            id_episodio=r[3], fecha_hora_inicio=r[4], fecha_hora_fin=r[5],
            dispositivo=r[6], porcentaje_avance=r[7]
        ) for r in cursor]
        cursor.close()
        return result
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


# ==================== FAVORITOS ====================
def agregar_favorito(data: FavoritoCreate) -> Favorito:
    """Agrega un contenido a favoritos."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc)
        cursor.execute(
            f"""INSERT INTO {fq('FAVORITOS')} (id_perfil, id_contenido, fecha_agregado)
               VALUES (:1, :2, :3)""",
            [data.id_perfil, data.id_contenido, now]
        )
        conn.commit()
        cursor.close()
        return Favorito(
            id_perfil=data.id_perfil, id_contenido=data.id_contenido,
            fecha_agregado=now
        )
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


def eliminar_favorito(id_perfil: int, id_contenido: int) -> bool:
    """Elimina un favorito."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"DELETE FROM {fq('FAVORITOS')} WHERE id_perfil = :1 AND id_contenido = :2",
            [id_perfil, id_contenido]
        )
        deleted = cursor.rowcount
        conn.commit()
        cursor.close()
        return deleted > 0
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


def listar_favoritos(id_perfil: int, offset: int = 0, limit: int = 50) -> list[Favorito]:
    """Lista favoritos de un perfil."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT id_perfil, id_contenido, fecha_agregado
               FROM {fq('FAVORITOS')} WHERE id_perfil = :1
               ORDER BY fecha_agregado DESC
               OFFSET :2 ROWS FETCH NEXT :3 ROWS ONLY""",
            [id_perfil, offset, limit]
        )
        result = [Favorito(id_perfil=r[0], id_contenido=r[1], fecha_agregado=r[2]) for r in cursor]
        cursor.close()
        return result
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


# ==================== CALIFICACIONES ====================
def crear_calificacion(data: CalificacionCreate) -> Calificacion:
    """Crea o actualiza una calificacion (upsert por unique key)."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc)
        cursor.execute(
            f"""MERGE INTO {fq('CALIFICACIONES')} c
               USING (SELECT :1 AS p, :2 AS c FROM DUAL) src
               ON (c.id_perfil = src.p AND c.id_contenido = src.c)
               WHEN MATCHED THEN UPDATE SET estrellas = :3, resenia = :4, fecha_calificacion = :5
               WHEN NOT MATCHED THEN INSERT (id_calificacion, id_perfil, id_contenido, estrellas, resenia, fecha_calificacion)
                 VALUES (seq_calificaciones.NEXTVAL, :1, :2, :3, :4, :5)""",
            [data.id_perfil, data.id_contenido,
             data.estrellas, data.resenia, now]
        )
        conn.commit()
        cursor.close()

        return obtener_calificacion(data.id_perfil, data.id_contenido)
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


def obtener_calificacion(id_perfil: int, id_contenido: int) -> Calificacion:
    """Obtiene calificacion por perfil y contenido."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT id_calificacion, id_perfil, id_contenido, estrellas, resenia, fecha_calificacion
               FROM {fq('CALIFICACIONES')} WHERE id_perfil = :1 AND id_contenido = :2""",
            [id_perfil, id_contenido]
        )
        row = cursor.fetchone()
        cursor.close()
        return Calificacion(
            id_calificacion=row[0], id_perfil=row[1], id_contenido=row[2],
            estrellas=row[3], resenia=_read_clob(row[4]), fecha_calificacion=row[5]
        )
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


def actualizar_calificacion(id_calificacion: int, estrellas: int, resenia: Optional[str]) -> Calificacion | None:
    """Actualiza una calificacion por ID."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""UPDATE {fq('CALIFICACIONES')}
               SET estrellas = :1, resenia = :2, fecha_calificacion = :3
               WHERE id_calificacion = :4""",
            [estrellas, resenia, datetime.now(timezone.utc), id_calificacion]
        )
        if cursor.rowcount == 0:
            cursor.close()
            return None
        conn.commit()
        cursor.close()

        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT id_calificacion, id_perfil, id_contenido, estrellas, resenia, fecha_calificacion
               FROM {fq('CALIFICACIONES')} WHERE id_calificacion = :1""",
            [id_calificacion]
        )
        row = cursor.fetchone()
        cursor.close()
        return Calificacion(
            id_calificacion=row[0], id_perfil=row[1], id_contenido=row[2],
            estrellas=row[3], resenia=_read_clob(row[4]), fecha_calificacion=row[5]
        )
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


def eliminar_calificacion(id_calificacion: int) -> bool:
    """Elimina una calificacion por ID."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"DELETE FROM {fq('CALIFICACIONES')} WHERE id_calificacion = :1",
            [id_calificacion]
        )
        deleted = cursor.rowcount
        conn.commit()
        cursor.close()
        return deleted > 0
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


def calificaciones_por_contenido(id_contenido: int, offset: int = 0, limit: int = 50) -> list[Calificacion]:
    """Obtiene todas las calificaciones de un contenido."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT id_calificacion, id_perfil, id_contenido, estrellas, resenia, fecha_calificacion
               FROM {fq('CALIFICACIONES')} WHERE id_contenido = :1
               ORDER BY fecha_calificacion DESC
               OFFSET :2 ROWS FETCH NEXT :3 ROWS ONLY""",
            [id_contenido, offset, limit]
        )
        result = [Calificacion(
            id_calificacion=r[0], id_perfil=r[1], id_contenido=r[2],
            estrellas=r[3], resenia=_read_clob(r[4]), fecha_calificacion=r[5]
        ) for r in cursor]
        cursor.close()
        return result
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")
