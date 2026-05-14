"""Servicio de autenticacion: registro, login, vericacion de tokens con Oracle."""

from datetime import date, datetime

import oracledb

from ..auth import create_access_token, hash_password, verify_password
from ..database import get_connection, release_connection, fq
from ..oracle_errors import handle_oracle_error
from ..schemas.usuario import UsuarioCreate, UsuarioLogin, Token, Usuario, Perfil


def execute_sp_registrar_usuario(
    conn, p_nombre, p_email, p_telefono, p_fecha_nacimiento,
    p_ciudad, p_id_plan, p_id_referidor, p_metodo_pago
) -> int:
    """Ejecuta SP_REGISTRAR_USUARIO_COMPLETO y retorna el id_usuario generado."""
    out_cursor = conn.cursor()
    try:
        out_id_usuario = out_cursor.var(int)
        out_cursor.callproc(
            f"{fq('SP_REGISTRAR_USUARIO_COMPLETO')}",
            [
                p_nombre,
                p_email,
                p_telefono,
                p_fecha_nacimiento,
                p_ciudad,
                p_id_plan,
                p_id_referidor,
                p_metodo_pago,
                out_id_usuario,
            ]
        )
        return out_id_usuario.getvalue()
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        out_cursor.close()


def _insert_auth(conn, id_usuario: int, password_hash: str) -> None:
    """Inserta credenciales en USUARIOS_AUTH."""
    cursor = conn.cursor()
    try:
        cursor.execute(
            f"INSERT INTO {fq('USUARIOS_AUTH')} (id_usuario, password_hash) VALUES (:1, :2)",
            [id_usuario, password_hash]
        )
    finally:
        cursor.close()


def registrar_usuario(data: UsuarioCreate) -> Usuario:
    """Registra un nuevo usuario usando SP_REGISTRAR_USUARIO_COMPLETO."""
    conn = get_connection("admin")
    try:
        hashed = hash_password(data.password)

        telefono = data.telefono if data.telefono and data.telefono.strip() else "Sin telefono"
        fecha_nac_raw = data.fecha_nacimiento
        if fecha_nac_raw is None:
            fecha_nac = date(1900, 1, 1)
        elif isinstance(fecha_nac_raw, str):
            if not fecha_nac_raw.strip():
                fecha_nac = date(1900, 1, 1)
            else:
                try:
                    fecha_nac = datetime.strptime(fecha_nac_raw, "%Y-%m-%d").date()
                except ValueError:
                    fecha_nac = date(1900, 1, 1)
        else:
            fecha_nac = fecha_nac_raw
        ciudad = data.ciudad if data.ciudad and data.ciudad.strip() else "Sin ciudad"

        id_usuario = execute_sp_registrar_usuario(
            conn,
            data.nombre,
            data.email,
            telefono,
            fecha_nac,
            ciudad,
            data.id_plan,
            data.codigo_referido,
            "PSE",
        )

        _insert_auth(conn, id_usuario, hashed)
        conn.commit()

        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT id_usuario, nombre, email, telefono, ciudad,
                      fecha_nacimiento, id_plan, estado_cuenta, fecha_registro,
                      NVL(es_admin, 'N')
               FROM {fq('USUARIOS')} WHERE id_usuario = :1""",
            [id_usuario]
        )
        row = cursor.fetchone()
        cursor.close()

        role = "admin" if row[9] == "S" else "usuario"
        return Usuario(
            id_usuario=row[0], nombre=row[1], email=row[2],
            telefono=row[3], ciudad=row[4], fecha_nacimiento=row[5],
            id_plan=row[6], estado_cuenta=row[7], fecha_registro=row[8],
            codigo_referido=data.codigo_referido,
            es_admin=(row[9] == "S"),
            role=role,
        )
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


def autenticar_usuario(data: UsuarioLogin) -> Token | None:
    """Autentica un usuario por email/password y retorna Token o None."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT u.id_usuario, u.nombre, u.email, u.telefono, u.ciudad,
                      u.fecha_nacimiento, u.id_plan, u.estado_cuenta, u.fecha_registro,
                      a.password_hash, NVL(u.es_admin, 'N')
               FROM {fq('USUARIOS')} u
               JOIN {fq('USUARIOS_AUTH')} a ON a.id_usuario = u.id_usuario
               WHERE u.email = :1""",
            [data.email]
        )
        row = cursor.fetchone()
        cursor.close()

        if not row:
            return None

        if not verify_password(data.password, row[9]):
            return None

        es_admin = (row[10] == "S")
        role = "admin" if es_admin else "usuario"

        usuario = Usuario(
            id_usuario=row[0], nombre=row[1], email=row[2],
            telefono=row[3], ciudad=row[4], fecha_nacimiento=row[5],
            id_plan=row[6], estado_cuenta=row[7], fecha_registro=row[8],
            codigo_referido=None,
            es_admin=es_admin,
            role=role,
        )

        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT id_perfil, id_usuario, nombre_perfil, avatar, tipo
               FROM {fq('PERFILES')} WHERE id_usuario = :1""",
            [usuario.id_usuario]
        )
        perfiles = [
            Perfil(
                id_perfil=r[0], id_usuario=r[1],
                nombre_perfil=r[2], avatar=r[3], tipo=r[4]
            ) for r in cursor
        ]
        cursor.close()

        token_str = create_access_token({
            "sub": str(usuario.id_usuario),
            "role": role,
        })

        return Token(token=token_str, usuario=usuario, perfiles=perfiles)
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


def obtener_usuario_por_id(id_usuario: int) -> Usuario | None:
    """Obtiene un usuario por su ID."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT id_usuario, nombre, email, telefono, ciudad,
                      fecha_nacimiento, id_plan, estado_cuenta, fecha_registro,
                      NVL(es_admin, 'N')
               FROM {fq('USUARIOS')} WHERE id_usuario = :1""",
            [id_usuario]
        )
        row = cursor.fetchone()
        cursor.close()

        if not row:
            return None

        role = "admin" if row[9] == "S" else "usuario"
        return Usuario(
            id_usuario=row[0], nombre=row[1], email=row[2],
            telefono=row[3], ciudad=row[4], fecha_nacimiento=row[5],
            id_plan=row[6], estado_cuenta=row[7], fecha_registro=row[8],
            codigo_referido=None,
            es_admin=(row[9] == "S"),
            role=role,
        )
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")
