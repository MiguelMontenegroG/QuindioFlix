"""Servicio CRUD para Catalogo, Temporadas y Episodios."""

import oracledb

from ..database import get_connection, release_connection, fq
from ..oracle_errors import handle_oracle_error
from ..schemas.contenido import (
    Contenido, ContenidoCreate, ContenidoUpdate,
    Temporada, TemporadaCreate, TemporadaUpdate,
    Episodio, EpisodioCreate, EpisodioUpdate,
    Categoria, Genero, BusquedaParams,
)


def _read_clob(val):
    if val is None:
        return None
    if hasattr(val, 'read'):
        return val.read()
    return str(val)


def _to_date(val):
    """Convierte datetime o string a date para Pydantic v2."""
    if val is None:
        return None
    if hasattr(val, 'date'):
        return val.date()
    return val


def _row_to_contenido(row) -> Contenido:
    return Contenido(
        id_contenido=row[0], titulo=row[1], anio_lanzamiento=row[2],
        duracion=row[3], sinopsis=_read_clob(row[4]), clasificacion_edad=row[5],
        fecha_agregado=_to_date(row[6]), es_original=row[7],
        id_categoria=row[8], id_empleado_resp=row[9]
    )


def listar_contenido(params: BusquedaParams) -> tuple[list[Contenido], int]:
    """Lista contenido con filtros opcionales y paginacion."""
    conn = get_connection("contenido")
    try:
        cursor = conn.cursor()

        where_clauses = []
        binds = {}

        if params.q:
            where_clauses.append("LOWER(c.titulo) LIKE LOWER(:q)")
            binds["q"] = f"%{params.q}%"
        if params.categoria:
            where_clauses.append("c.id_categoria = :categoria")
            binds["categoria"] = params.categoria
        if params.genero:
            where_clauses.append(
                f"EXISTS (SELECT 1 FROM {fq('CONTENIDO_GENERO')} cg WHERE cg.id_contenido = c.id_contenido AND cg.id_genero = :genero)"
            )
            binds["genero"] = params.genero
        if params.anio:
            where_clauses.append("c.anio_lanzamiento = :anio")
            binds["anio"] = params.anio
        if params.clasificacion:
            where_clauses.append("c.clasificacion_edad = :clasif")
            binds["clasif"] = params.clasificacion

        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

        cursor.execute(f"SELECT COUNT(*) FROM {fq('CONTENIDO')} c WHERE {where_sql}", binds)
        total = cursor.fetchone()[0]

        offset = (params.pagina - 1) * params.por_pagina

        # Incluir JOIN a CATEGORIAS para obtener nombre_categoria
        sql = f"""
            SELECT c.id_contenido, c.titulo, c.anio_lanzamiento, c.duracion,
                   c.sinopsis, c.clasificacion_edad, c.fecha_agregado, c.es_original,
                   c.id_categoria, c.id_empleado_resp,
                   cat.nombre_categoria, cat.descripcion
            FROM {fq('CONTENIDO')} c
            LEFT JOIN {fq('CATEGORIAS')} cat ON cat.id_categoria = c.id_categoria
            WHERE {where_sql}
            ORDER BY c.fecha_agregado DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        """
        binds["offset"] = offset
        binds["limit"] = params.por_pagina

        cursor.execute(sql, binds)
        # Construir objetos Contenido con categoria incluida
        resultados = []
        for row in cursor:
            contenido = Contenido(
                id_contenido=row[0], titulo=row[1], anio_lanzamiento=row[2],
                duracion=row[3], sinopsis=_read_clob(row[4]), clasificacion_edad=row[5],
                fecha_agregado=_to_date(row[6]), es_original=row[7],
                id_categoria=row[8], id_empleado_resp=row[9],
            )
            if row[10]:
                contenido.categoria = Categoria(
                    id_categoria=row[8], nombre_categoria=row[10], descripcion=row[11]
                )
            resultados.append(contenido)

        cursor.close()
        return resultados, total
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "contenido")


def obtener_contenido_por_id(id_contenido: int) -> Contenido | None:
    """Obtiene un contenido por ID con sus generos."""
    conn = get_connection("contenido")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT c.id_contenido, c.titulo, c.anio_lanzamiento, c.duracion,
                      c.sinopsis, c.clasificacion_edad, c.fecha_agregado, c.es_original,
                      c.id_categoria, c.id_empleado_resp,
                      cat.nombre_categoria, cat.descripcion
               FROM {fq('CONTENIDO')} c
               LEFT JOIN {fq('CATEGORIAS')} cat ON cat.id_categoria = c.id_categoria
               WHERE c.id_contenido = :1""",
            [id_contenido]
        )
        row = cursor.fetchone()
        if not row:
            cursor.close()
            return None

        contenido = Contenido(
            id_contenido=row[0], titulo=row[1], anio_lanzamiento=row[2],
            duracion=row[3], sinopsis=_read_clob(row[4]), clasificacion_edad=row[5],
            fecha_agregado=_to_date(row[6]), es_original=row[7],
            id_categoria=row[8], id_empleado_resp=row[9],
        )
        # Asignar categoria como objeto
        if row[10]:
            contenido.categoria = Categoria(
                id_categoria=row[8], nombre_categoria=row[10], descripcion=row[11]
            )

        cursor.execute(
            f"""SELECT g.id_genero, g.nombre_genero
               FROM {fq('GENEROS')} g
               JOIN {fq('CONTENIDO_GENERO')} cg ON cg.id_genero = g.id_genero
               WHERE cg.id_contenido = :1""",
            [id_contenido]
        )
        contenido.generos = [Genero(id_genero=r[0], nombre_genero=r[1]) for r in cursor]

        cursor.execute(
            f"SELECT id_categoria, nombre_categoria, descripcion FROM {fq('CATEGORIAS')} WHERE id_categoria = :1",
            [contenido.id_categoria]
        )
        cat_row = cursor.fetchone()
        if cat_row:
            contenido.categoria = Categoria(
                id_categoria=cat_row[0], nombre_categoria=cat_row[1],
                descripcion=cat_row[2]
            )

        cursor.execute(
            f"SELECT ROUND(AVG(estrellas), 2) FROM {fq('CALIFICACIONES')} WHERE id_contenido = :1",
            [id_contenido]
        )
        avg_row = cursor.fetchone()
        contenido.calificacion_promedio = float(avg_row[0]) if avg_row and avg_row[0] is not None else None

        cursor.close()
        contenido.temporadas = listar_temporadas(id_contenido)
        return contenido
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "contenido")


def crear_contenido(data: ContenidoCreate) -> Contenido:
    """Crea un nuevo contenido y asigna generos."""
    conn = get_connection("contenido")
    try:
        cursor = conn.cursor()
        id_var = cursor.var(int)
        cursor.execute(
            f"""INSERT INTO {fq('CONTENIDO')} (id_contenido, titulo, anio_lanzamiento, duracion,
               sinopsis, clasificacion_edad, es_original, id_categoria, id_empleado_resp)
               VALUES (seq_contenido.NEXTVAL, :1, :2, :3, :4, :5, :6, :7, :8)
               RETURNING id_contenido INTO :9""",
            [data.titulo, data.anio_lanzamiento, data.duracion,
             data.sinopsis, data.clasificacion_edad, data.es_original,
             data.id_categoria, data.id_empleado_resp,
             id_var]
        )
        id_contenido = id_var.getvalue()[0]

        for gen_id in data.generos:
            cursor.execute(
                f"INSERT INTO {fq('CONTENIDO_GENERO')} (id_contenido, id_genero) VALUES (:1, :2)",
                [id_contenido, gen_id]
            )

        conn.commit()
        cursor.close()
        return obtener_contenido_por_id(id_contenido)
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "contenido")


def actualizar_contenido(id_contenido: int, data: ContenidoUpdate) -> Contenido | None:
    """Actualiza un contenido existente."""
    conn = get_connection("contenido")
    try:
        cursor = conn.cursor()
        updates = []
        binds = {"id": id_contenido}

        for field in ["titulo", "anio_lanzamiento", "duracion", "sinopsis",
                       "clasificacion_edad", "es_original", "id_categoria", "id_empleado_resp"]:
            value = getattr(data, field, None)
            if value is not None:
                updates.append(f"{field} = :{field}")
                binds[field] = value

        if updates:
            sql = f"UPDATE {fq('CONTENIDO')} SET {', '.join(updates)} WHERE id_contenido = :id"
            cursor.execute(sql, binds)

        if data.generos is not None:
            cursor.execute(f"DELETE FROM {fq('CONTENIDO_GENERO')} WHERE id_contenido = :1", [id_contenido])
            for gen_id in data.generos:
                cursor.execute(
                    f"INSERT INTO {fq('CONTENIDO_GENERO')} (id_contenido, id_genero) VALUES (:1, :2)",
                    [id_contenido, gen_id]
                )

        conn.commit()
        cursor.close()
        return obtener_contenido_por_id(id_contenido)
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "contenido")


def eliminar_contenido(id_contenido: int) -> bool:
    """Elimina un contenido (CASCADE elimina generos, temporadas, episodios)."""
    conn = get_connection("contenido")
    try:
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM {fq('CONTENIDO')} WHERE id_contenido = :1", [id_contenido])
        deleted = cursor.rowcount
        conn.commit()
        cursor.close()
        return deleted > 0
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "contenido")


def listar_temporadas(id_contenido: int) -> list[Temporada]:
    """Lista temporadas de un contenido."""
    conn = get_connection("contenido")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT id_temporada, id_contenido, numero_temporada,
                      titulo_temporada, anio
               FROM {fq('TEMPORADAS')} WHERE id_contenido = :1
               ORDER BY numero_temporada""",
            [id_contenido]
        )
        temporadas = []
        for row in cursor:
            temp = Temporada(
                id_temporada=row[0], id_contenido=row[1],
                numero_temporada=row[2], titulo_temporada=row[3], anio=row[4],
                episodios=[]
            )
            cursor2 = conn.cursor()
            cursor2.execute(
                f"""SELECT id_episodio, id_temporada, numero_episodio,
                          titulo_episodio, duracion, sinopsis_ep
                   FROM {fq('EPISODIOS')} WHERE id_temporada = :1
                   ORDER BY numero_episodio""",
                [temp.id_temporada]
            )
            for erow in cursor2:
                temp.episodios.append(Episodio(
                    id_episodio=erow[0], id_temporada=erow[1],
                    numero_episodio=erow[2], titulo_episodio=erow[3],
                    duracion=erow[4], sinopsis_ep=_read_clob(erow[5])
                ))
            cursor2.close()
            temporadas.append(temp)

        cursor.close()
        return temporadas
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "contenido")


def crear_temporada(data: TemporadaCreate) -> Temporada:
    """Crea una nueva temporada."""
    conn = get_connection("contenido")
    try:
        cursor = conn.cursor()
        id_var = cursor.var(int)
        cursor.execute(
            f"""INSERT INTO {fq('TEMPORADAS')} (id_temporada, id_contenido, numero_temporada,
               titulo_temporada, anio)
               VALUES (seq_temporadas.NEXTVAL, :1, :2, :3, :4)
               RETURNING id_temporada INTO :5""",
            [data.id_contenido, data.numero_temporada,
             data.titulo_temporada, data.anio, id_var]
        )
        id_temporada = id_var.getvalue()[0]
        conn.commit()
        cursor.close()
        return Temporada(
            id_temporada=id_temporada, id_contenido=data.id_contenido,
            numero_temporada=data.numero_temporada,
            titulo_temporada=data.titulo_temporada, anio=data.anio,
            episodios=[]
        )
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "contenido")


def crear_episodio(data: EpisodioCreate) -> Episodio:
    """Crea un nuevo episodio."""
    conn = get_connection("contenido")
    try:
        cursor = conn.cursor()
        id_var = cursor.var(int)
        cursor.execute(
            f"""INSERT INTO {fq('EPISODIOS')} (id_episodio, id_temporada, numero_episodio,
               titulo_episodio, duracion, sinopsis_ep)
               VALUES (seq_episodios.NEXTVAL, :1, :2, :3, :4, :5)
               RETURNING id_episodio INTO :6""",
            [data.id_temporada, data.numero_episodio, data.titulo_episodio,
             data.duracion, data.sinopsis_ep, id_var]
        )
        id_episodio = id_var.getvalue()[0]
        conn.commit()
        cursor.close()
        return Episodio(
            id_episodio=id_episodio, id_temporada=data.id_temporada,
            numero_episodio=data.numero_episodio,
            titulo_episodio=data.titulo_episodio,
            duracion=data.duracion, sinopsis_ep=data.sinopsis_ep
        )
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "contenido")


def listar_categorias() -> list[Categoria]:
    """Lista todas las categorias."""
    conn = get_connection("contenido")
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT id_categoria, nombre_categoria, descripcion FROM {fq('CATEGORIAS')} ORDER BY nombre_categoria")
        cats = [Categoria(id_categoria=r[0], nombre_categoria=r[1], descripcion=r[2]) for r in cursor]
        cursor.close()
        return cats
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "contenido")


def listar_generos() -> list[Genero]:
    """Lista todos los generos."""
    conn = get_connection("contenido")
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT id_genero, nombre_genero FROM {fq('GENEROS')} ORDER BY nombre_genero")
        gens = [Genero(id_genero=r[0], nombre_genero=r[1]) for r in cursor]
        cursor.close()
        return gens
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "contenido")


def contenido_recomendado(id_perfil: int) -> Contenido | None:
    """Obtiene contenido recomendado para un perfil usando FN_CONTENIDO_RECOMENDADO."""
    conn = get_connection("contenido")
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT {fq('FN_CONTENIDO_RECOMENDADO')}(:1) FROM DUAL", [id_perfil])
        id_contenido = cursor.fetchone()[0]
        cursor.close()
        if id_contenido == -1:
            return None
        return obtener_contenido_por_id(int(id_contenido))
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "contenido")
