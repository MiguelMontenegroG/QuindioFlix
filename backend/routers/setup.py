"""Router de setup: creacion del administrador inicial."""

from fastapi import APIRouter, HTTPException

from auth import hash_password
from database import get_connection, release_connection
from schemas.usuario import Usuario

router = APIRouter(prefix="/setup", tags=["Setup"])


@router.post("/first-admin")
def crear_admin_inicial():
    """Crea el usuario administrador inicial si no existe.

    Credenciales por defecto:
    - Email: admin@quindioflix.com
    - Password: Admin123!

    Solo funciona si no hay ningun admin registrado aun.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()

        # Verificar si ya existe un admin
        cursor.execute("SELECT COUNT(*) FROM USUARIOS WHERE es_admin = 'S'")
        count = cursor.fetchone()[0]

        if count > 0:
            cursor.close()
            return {"mensaje": "Ya existe un administrador registrado"}

        # Verificar si ya existe el email
        cursor.execute("SELECT COUNT(*) FROM USUARIOS WHERE email = 'admin@quindioflix.com'")
        email_count = cursor.fetchone()[0]

        if email_count > 0:
            # Si el email existe pero no es admin, lo promovemos
            cursor.execute("UPDATE USUARIOS SET es_admin = 'S' WHERE email = 'admin@quindioflix.com'")
            conn.commit()
            cursor.close()
            return {"mensaje": "Usuario existente promovido a administrador"}

        # Crear admin
        hashed = hash_password("Admin123!")
        cursor.execute(
            """INSERT INTO USUARIOS (id_usuario, nombre, email, telefono,
               fecha_nacimiento, ciudad, estado_cuenta, id_plan,
               password_hash, es_admin)
               VALUES (seq_usuarios.NEXTVAL, :1, :2, :3, :4, :5, 'ACTIVO', 1, :6, 'S')
               RETURNING id_usuario INTO :7""",
            [
                "Administrador QuindioFlix",
                "admin@quindioflix.com",
                "3000000000",
                "1990-01-01",
                "Armenia",
                hashed,
                cursor.var(int),
            ]
        )
        id_usuario = cursor.fetchone()[0]

        # Crear perfil admin
        cursor.execute(
            """INSERT INTO PERFILES (id_perfil, id_usuario, nombre_perfil, avatar, tipo)
               VALUES (seq_perfiles.NEXTVAL, :1, 'Admin', 'admin.png', 'ADULTO')""",
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
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        release_connection(conn)
