"""Router de setup: creacion del administrador inicial."""

import oracledb
from fastapi import APIRouter, HTTPException

from backend.auth import hash_password
from backend.database import get_connection, release_connection, fq
from backend.oracle_errors import handle_oracle_error

router = APIRouter(prefix="/setup", tags=["Setup"])


@router.post("/first-admin")
def crear_admin_inicial():
    """Crea el usuario administrador inicial si no existe.

    Credenciales por defecto:
    - Email: admin@quindioflix.com
    - Password: Admin123!

    Solo funciona si no hay ningun admin registrado aun.
    """
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()

        # Verificar si ya existe un admin
        cursor.execute(f"SELECT COUNT(*) FROM {fq('USUARIOS')} WHERE es_admin = 'S'")
        count = cursor.fetchone()[0]

        if count > 0:
            cursor.close()
            return {"mensaje": "Ya existe un administrador registrado"}

        # Verificar si ya existe el email
        cursor.execute(f"SELECT COUNT(*) FROM {fq('USUARIOS')} WHERE email = 'admin@quindioflix.com'")
        email_count = cursor.fetchone()[0]

        if email_count > 0:
            # Si el email existe pero no es admin, lo promovemos
            cursor.execute(f"UPDATE {fq('USUARIOS')} SET es_admin = 'S' WHERE email = 'admin@quindioflix.com'")
            conn.commit()
            cursor.close()
            return {"mensaje": "Usuario existente promovido a administrador"}

        # Crear admin via SP
        hashed = hash_password("Admin123!")
        out_id = cursor.var(int)
        cursor.callproc(
            f"{fq('SP_REGISTRAR_USUARIO_COMPLETO')}",
            [
                "Administrador QuindioFlix",
                "admin@quindioflix.com",
                "3000000000",
                "1990-01-01",
                "Armenia",
                1,
                None,
                "PSE",
                out_id,
            ]
        )
        id_usuario = out_id.getvalue()

        cursor.execute(
            f"INSERT INTO {fq('USUARIOS_AUTH')} (id_usuario, password_hash) VALUES (:1, :2)",
            [id_usuario, hashed]
        )
        cursor.execute(
            f"UPDATE {fq('USUARIOS')} SET es_admin = 'S' WHERE id_usuario = :1",
            [id_usuario]
        )

        conn.commit()
        cursor.close()

        return {
            "mensaje": "Administrador creado exitosamente",
            "email": "admin@quindioflix.com",
            "password": "Admin123!",
            "id_usuario": id_usuario,
        }
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")
