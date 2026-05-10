"""Servicio de autenticacion: registro, login, vericacion de tokens con Oracle."""

from datetime import datetime

import oracledb

from auth import create_access_token, hash_password, verify_password
from database import get_connection, release_connection
from schemas.usuario import UsuarioCreate, UsuarioLogin, Token, Usuario, Perfil


def execute_sp_registrar_usuario(
    conn, p_nombre, p_email, p_password, p_telefono, p_fecha_nacimiento,
    p_ciudad, p_id_plan, p_codigo_referido
) -> int:
    """Ejecuta SP_REGISTRAR_USUARIO y retorna el id_usuario generado."""
    out_cursor = conn.cursor()
    try:
        out_cursor.callproc(
            "SP_REGISTRAR_USUARIO",
            [
                p_nombre, p_email, p_password, p_telefono,
                p_fecha_nacimiento, p_ciudad, p_id_plan, p_codigo_referido
            ]
        )
        cursor = conn.cursor()
        cursor.execute("SELECT seq_usuarios.CURRVAL FROM DUAL")
        row = cursor.fetchone()
        cursor.close()
        return row[0] if row else None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        out_cursor.close()


def registrar_usuario(data: UsuarioCreate) -> Usuario:
    """Registra un nuevo usuario usando SP_REGISTRAR_USUARIO."""
    conn = get_connection()
    try:
        hashed = hash_password(data.password)
        id_usuario = execute_sp_registrar_usuario(
            conn,
            data.nombre,
            data.email,
            hashed,
            data.telefono,
            data.fecha_nacimiento,
            data.ciudad,
            data.id_plan,
            data.codigo_referido
        )
        conn.commit()

        cursor = conn.cursor()
        cursor.execute(
            """SELECT id_usuario, nombre, email, telefono, ciudad,
                      fecha_nacimiento, id_plan, estado_cuenta, fecha_registro,
                      NVL(es_admin, 'N')
               FROM USUARIOS WHERE id_usuario = :1""", [id_usuario]
        )
        row = cursor.fetchone()
        cursor.close()

        return Usuario(
            id_usuario=row[0], nombre=row[1], email=row[2],
            telefono=row[3], ciudad=row[4], fecha_nacimiento=row[5],
            id_plan=row[6], estado_cuenta=row[7], fecha_registro=row[8],
            codigo_referido=data.codigo_referido,
            es_admin=(row[9] == 'S')
        )
    finally:
        release_connection(conn)


def autenticar_usuario(data: UsuarioLogin) -> Token | None:
    """Autentica un usuario por email/password y retorna Token o None."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT id_usuario, nombre, email, telefono, ciudad,
                      fecha_nacimiento, id_plan, estado_cuenta, fecha_registro,
                      password_hash, NVL(es_admin, 'N')
               FROM USUARIOS WHERE email = :1""", [data.email]
        )
        row = cursor.fetchone()
        cursor.close()

        if not row:
            return None

        # Verificar contrasena contra password_hash
        if not verify_password(data.password, row[9]):
            return None

        es_admin = (row[10] == 'S')

        usuario = Usuario(
            id_usuario=row[0], nombre=row[1], email=row[2],
            telefono=row[3], ciudad=row[4], fecha_nacimiento=row[5],
            id_plan=row[6], estado_cuenta=row[7], fecha_registro=row[8],
            codigo_referido=None,
            es_admin=es_admin
        )

        # Obtener perfiles
        cursor = conn.cursor()
        cursor.execute(
            """SELECT id_perfil, id_usuario, nombre_perfil, avatar, tipo
               FROM PERFILES WHERE id_usuario = :1""", [usuario.id_usuario]
        )
        perfiles = []
        for r in cursor:
            perfiles.append(Perfil(
                id_perfil=r[0], id_usuario=r[1],
                nombre_perfil=r[2], avatar=r[3], tipo=r[4]
            ))
        cursor.close()

        # Generar token JWT incluyendo es_admin
        token_str = create_access_token({
            "sub": str(usuario.id_usuario),
            "es_admin": es_admin
        })

        return Token(token=token_str, usuario=usuario, perfiles=perfiles)
    finally:
        release_connection(conn)


def obtener_usuario_por_id(id_usuario: int) -> Usuario | None:
    """Obtiene un usuario por su ID."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT id_usuario, nombre, email, telefono, ciudad,
                      fecha_nacimiento, id_plan, estado_cuenta, fecha_registro,
                      NVL(es_admin, 'N')
               FROM USUARIOS WHERE id_usuario = :1""", [id_usuario]
        )
        row = cursor.fetchone()
        cursor.close()

        if not row:
            return None

        return Usuario(
            id_usuario=row[0], nombre=row[1], email=row[2],
            telefono=row[3], ciudad=row[4], fecha_nacimiento=row[5],
            id_plan=row[6], estado_cuenta=row[7], fecha_registro=row[8],
            codigo_referido=None,
            es_admin=(row[9] == 'S')
        )
    finally:
        release_connection(conn)
