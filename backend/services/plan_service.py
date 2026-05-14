"""Servicio para gestion de planes y pagos (SP_CAMBIAR_PLAN, FN_CALCULAR_MONTO)."""

from datetime import datetime
import oracledb

from ..database import get_connection, release_connection, fq
from ..oracle_errors import handle_oracle_error
from ..schemas.pago import Pago, PagoCreate
from ..schemas.usuario import Plan, Usuario


def listar_planes() -> list[Plan]:
    """Lista todos los planes disponibles."""
    conn = get_connection("soporte")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT id_plan, nombre_plan, precio_mensual, num_pantallas, calidad_video, max_perfiles FROM {fq('PLANES')} ORDER BY id_plan"
        )
        planes = [Plan(
            id_plan=r[0], nombre_plan=r[1], precio_mensual=float(r[2]),
            num_pantallas=r[3], calidad_video=r[4], max_perfiles=r[5]
        ) for r in cursor]
        cursor.close()
        return planes
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "soporte")


def obtener_plan(id_plan: int) -> Plan | None:
    """Obtiene un plan por ID."""
    conn = get_connection("soporte")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT id_plan, nombre_plan, precio_mensual, num_pantallas, calidad_video, max_perfiles FROM {fq('PLANES')} WHERE id_plan = :1",
            [id_plan]
        )
        row = cursor.fetchone()
        cursor.close()
        if not row:
            return None
        return Plan(
            id_plan=row[0], nombre_plan=row[1], precio_mensual=float(row[2]),
            num_pantallas=row[3], calidad_video=row[4], max_perfiles=row[5]
        )
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "soporte")


def cambiar_plan(id_usuario: int, id_plan_nuevo: int, metodo_pago: str = "PSE") -> Usuario:
    """Ejecuta SP_CAMBIAR_PLAN para cambiar el plan de un usuario."""
    conn = get_connection("soporte")
    try:
        cursor = conn.cursor()
        cursor.callproc(f"{fq('SP_CAMBIAR_PLAN')}", [id_usuario, id_plan_nuevo, metodo_pago])
        conn.commit()
        cursor.close()

        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT id_usuario, nombre, email, telefono, ciudad,
                      fecha_nacimiento, id_plan, estado_cuenta, fecha_registro
               FROM {fq('USUARIOS')} WHERE id_usuario = :1""", [id_usuario]
        )
        row = cursor.fetchone()
        cursor.close()
        return Usuario(
            id_usuario=row[0], nombre=row[1], email=row[2],
            telefono=row[3], ciudad=row[4], fecha_nacimiento=row[5],
            id_plan=row[6], estado_cuenta=row[7], fecha_registro=row[8],
            codigo_referido=None
        )
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "soporte")


def calcular_monto(id_usuario: int) -> float:
    """Calcula el monto a pagar usando FN_CALCULAR_MONTO."""
    conn = get_connection("soporte")
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT {fq('FN_CALCULAR_MONTO')}(:1) FROM DUAL", [id_usuario])
        monto = cursor.fetchone()[0]
        cursor.close()
        return float(monto)
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "soporte")


def registrar_pago(data: PagoCreate) -> Pago:
    """Registra un nuevo pago."""
    conn = get_connection("soporte")
    try:
        cursor = conn.cursor()
        now = datetime.now()
        cursor.execute(
            f"""INSERT INTO {fq('PAGOS')} (id_pago, id_usuario, fecha_pago, monto, metodo_pago, estado_pago, fecha_vencimiento)
               VALUES (seq_pagos.NEXTVAL, :1, :2, :3, :4, :5, :6)
               RETURNING id_pago, fecha_pago INTO :7, :8""",
            [data.id_usuario, now, data.monto, data.metodo_pago,
             data.estado_pago, data.fecha_vencimiento, cursor.var(int), cursor.var(str)]
        )
        id_pago, fecha_pago = cursor.fetchone()
        conn.commit()
        cursor.close()

        return Pago(
            id_pago=id_pago, id_usuario=data.id_usuario,
            fecha_pago=fecha_pago, monto=data.monto,
            metodo_pago=data.metodo_pago, estado_pago=data.estado_pago,
            fecha_vencimiento=data.fecha_vencimiento
        )
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "soporte")


def pagos_por_usuario(id_usuario: int) -> list[Pago]:
    """Obtiene el historial de pagos de un usuario."""
    conn = get_connection("soporte")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""SELECT id_pago, id_usuario, fecha_pago, monto, metodo_pago, estado_pago, fecha_vencimiento
               FROM {fq('PAGOS')} WHERE id_usuario = :1 ORDER BY fecha_pago DESC""",
            [id_usuario]
        )
        pagos = [Pago(
            id_pago=r[0], id_usuario=r[1], fecha_pago=r[2],
            monto=float(r[3]), metodo_pago=r[4], estado_pago=r[5],
            fecha_vencimiento=r[6]
        ) for r in cursor]
        cursor.close()
        return pagos
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "soporte")
