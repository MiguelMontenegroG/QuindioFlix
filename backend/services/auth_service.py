"""Servicio de autenticacion: registro, login, vericacion de tokens con Oracle."""

from datetime import date, datetime

import oracledb

from auth import create_access_token, hash_password, verify_password
from database import get_connection, release_connection
from schemas.usuario import UsuarioCreate, UsuarioLogin, Token, Usuario, Perfil


def execute_sp_registrar_usuario(
    conn, p_nombre, p_email, p_password_hash, p_telefono, p_fecha_nacimiento,
    p_ciudad, p_id_plan, p_codigo_referido
) -> int:
    """Ejecuta SP_REGISTRAR_USUARIO y retorna el id_usuario generado.

    El SP actual tiene 10 parametros (9 IN, 1 OUT):
      1: p_nombre, 2: p_email, 3: p_password_hash, 4: p_telefono,
      5: p_fnac, 6: p_ciudad, 7: p_id_plan, 8: p_id_referidor,
      9: p_metodo_pago, 10: p_id_usuario (OUT)
    """
    out_cursor = conn.cursor()
    try:
        # Preparar el parametro OUT
        out_id_usuario = out_cursor.var(int)

        # Llamar al SP con los parametros en el ORDEN CORRECTO
        # incluyendo p_password_hash como 3er parametro
        out_cursor.callproc(
            "SP_REGISTRAR_USUARIO",
            [
                p_nombre,               # 1: p_nombre
                p_email,                # 2: p_email
                p_password_hash,        # 3: p_password_hash
                p_telefono,             # 4: p_telefono
                p_fecha_nacimiento,     # 5: p_fnac
                p_ciudad,               # 6: p_ciudad
                p_id_plan,              # 7: p_id_plan
                p_codigo_referido,      # 8: p_id_referidor
                'PSE',                  # 9: p_metodo_pago
                out_id_usuario,         # 10: p_id_usuario (OUT)
            ]
        )

        # Obtener el ID del parametro OUT
        # oracledb devuelve un entero directamente para OUT params
        id_usuario = out_id_usuario.getvalue()

        return id_usuario
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

        # Asegurar valores por defecto para campos opcionales
        # El SP de Oracle espera valores no nulos para telefono, fecha_nacimiento y ciudad
        telefono = data.telefono if data.telefono and data.telefono.strip() else 'Sin telefono'
        # Manejar fecha_nacimiento: puede ser None, string vacio, o un objeto date
        fecha_nac_raw = data.fecha_nacimiento
        if fecha_nac_raw is None:
            fecha_nac = date(1900, 1, 1)
        elif isinstance(fecha_nac_raw, str):
            if not fecha_nac_raw.strip():
                fecha_nac = date(1900, 1, 1)
            else:
                try:
                    fecha_nac = datetime.strptime(fecha_nac_raw, '%Y-%m-%d').date()
                except ValueError:
                    fecha_nac = date(1900, 1, 1)
        else:
            fecha_nac = fecha_nac_raw
        ciudad = data.ciudad if data.ciudad and data.ciudad.strip() else 'Sin ciudad'

        id_usuario = execute_sp_registrar_usuario(
            conn,
            data.nombre,
            data.email,
            hashed,              # p_password_hash
            telefono,            # p_telefono (con fallback)
            fecha_nac,           # p_fnac (con fallback)
            ciudad,              # p_ciudad (con fallback)
            data.id_plan,
            data.codigo_referido  # p_id_referidor (opcional)
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
