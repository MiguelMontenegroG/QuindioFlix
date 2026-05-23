"""Routers de usuarios: perfil, plan, reporte y perfiles."""

import oracledb
from fastapi import APIRouter, HTTPException, Query, Depends

from ..database import get_connection, release_connection, fq
from ..dependencies import require_roles
from ..oracle_errors import handle_oracle_error
from ..schemas.usuario import (
    Usuario, UsuarioUpdate, Perfil, PerfilCreateRequest,
    CambiarPlanRequest,
)
from ..services.auth_service import obtener_usuario_por_id
from ..services.plan_service import cambiar_plan, pagos_por_usuario
from ..services.usuario_service import eliminar_cuenta, reporte_consumo

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/lista")
def listar_usuarios(
    estado: str | None = None,
    plan: int | None = None,
    ciudad: str | None = None,
    pagina: int = 1,
    por_pagina: int = 100,
):
    """Lista todos los usuarios (admin)."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        where_parts = []
        binds = {}

        if estado:
            where_parts.append("u.estado_cuenta = :estado")
            binds["estado"] = estado
        if plan:
            where_parts.append("u.id_plan = :plan")
            binds["plan"] = plan
        if ciudad:
            where_parts.append("u.ciudad = :ciudad")
            binds["ciudad"] = ciudad

        where = ""
        if where_parts:
            where = "WHERE " + " AND ".join(where_parts)

        cursor.execute(f"SELECT COUNT(*) FROM {fq('USUARIOS')} u {where}", binds)
        total = cursor.fetchone()[0]

        offset = (pagina - 1) * por_pagina
        cursor.execute(
            f"""SELECT u.id_usuario, u.nombre, u.email, u.telefono, u.ciudad,
                      u.fecha_nacimiento, u.id_plan, u.estado_cuenta, u.fecha_registro,
                      p.nombre_plan, NVL(u.es_admin, 'N')
               FROM {fq('USUARIOS')} u
               LEFT JOIN {fq('PLANES')} p ON p.id_plan = u.id_plan
               {where}
               ORDER BY u.id_usuario
               OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY""",
            {**binds, "offset": offset, "limit": por_pagina}
        )

        usuarios = []
        for r in cursor:
            usuarios.append({
                "id_usuario": r[0],
                "nombre": r[1],
                "email": r[2],
                "telefono": r[3],
                "ciudad": r[4],
                "fecha_nacimiento": str(r[5]) if r[5] else None,
                "id_plan": r[6],
                "estado_cuenta": r[7],
                "fecha_registro": str(r[8]) if r[8] else None,
                "plan": {"id": r[6], "nombre": r[9]} if r[9] else None,
                "es_admin": r[10] == "S",
            })
        cursor.close()
        return {"data": usuarios, "total": total}
    finally:
        release_connection(conn, "admin")


@router.get("/{id_usuario}", response_model=Usuario)
def obtener(id_usuario: int):
    """Obtiene un usuario por ID."""
    usuario = obtener_usuario_por_id(id_usuario)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.put("/{id_usuario}", response_model=Usuario)
def actualizar(id_usuario: int, data: UsuarioUpdate):
    """Actualiza datos de un usuario."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        updates = []
        binds = {"id": id_usuario}
        for field in ["nombre", "telefono", "ciudad", "id_plan"]:
            value = getattr(data, field, None)
            if value is not None:
                updates.append(f"{field} = :{field}")
                binds[field] = value
        if updates:
            sql = f"UPDATE {fq('USUARIOS')} SET {', '.join(updates)} WHERE id_usuario = :id"
            cursor.execute(sql, binds)
            conn.commit()
        cursor.close()
        return obtener_usuario_por_id(id_usuario)
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


@router.put("/{id_usuario}/plan")
def cambiar_plan_endpoint(id_usuario: int, data: CambiarPlanRequest):
    """Cambia el plan de un usuario usando SP_CAMBIAR_PLAN."""
    if id_usuario != data.id_usuario:
        raise HTTPException(status_code=400, detail="El ID de usuario no coincide")
    usuario = cambiar_plan(data.id_usuario, data.id_plan, data.metodo_pago)
    return {"mensaje": "Plan actualizado exitosamente", "usuario": usuario}


@router.delete("/{id_usuario}")
def eliminar_usuario(id_usuario: int, confirmacion: str = Query("CONFIRMAR")):
    """Elimina la cuenta de un usuario (SP_ELIMINAR_CUENTA)."""
    eliminar_cuenta(id_usuario, confirmacion)
    return {"mensaje": "Cuenta eliminada exitosamente"}


@router.get("/{id_usuario}/reporte")
def reporte_usuario(id_usuario: int, mes: int | None = None, anio: int | None = None):
    """Obtiene el reporte de consumo via SP_REPORTE_CONSUMO."""
    lineas = reporte_consumo(id_usuario, mes, anio)
    return {"id_usuario": id_usuario, "lineas": lineas}


@router.get("/{id_usuario}/pagos")
def pagos_usuario(id_usuario: int):
    """Obtiene el historial de pagos del usuario."""
    return pagos_por_usuario(id_usuario)


# ==================== PERFILES ====================

@router.get("/{id_usuario}/perfiles", response_model=list[Perfil])
def obtener_perfiles(id_usuario: int):
    """Obtiene los perfiles de un usuario."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT id_perfil, id_usuario, nombre_perfil, avatar, tipo FROM {fq('PERFILES')} WHERE id_usuario = :1 ORDER BY id_perfil",
            [id_usuario]
        )
        perfiles = [Perfil(id_perfil=r[0], id_usuario=r[1], nombre_perfil=r[2], avatar=r[3], tipo=r[4]) for r in cursor]
        cursor.close()
        return perfiles
    except oracledb.DatabaseError as e:
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")


@router.post("/{id_usuario}/perfiles", response_model=Perfil, status_code=201)
def crear_perfil(id_usuario: int, data: PerfilCreateRequest):
    """Crea un nuevo perfil para un usuario."""
    conn = get_connection("admin")
    try:
        cursor = conn.cursor()
        cursor.execute(
            f"""INSERT INTO {fq('PERFILES')} (id_perfil, id_usuario, nombre_perfil, avatar, tipo)
               VALUES (seq_perfiles.NEXTVAL, :1, :2, :3, :4)
               RETURNING id_perfil INTO :5""",
            [id_usuario, data.nombre_perfil, data.avatar, data.tipo, cursor.var(int)]
        )
        id_perfil = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        return Perfil(
            id_perfil=id_perfil, id_usuario=id_usuario,
            nombre_perfil=data.nombre_perfil, avatar=data.avatar, tipo=data.tipo
        )
    except oracledb.DatabaseError as e:
        conn.rollback()
        handle_oracle_error(e)
    finally:
        release_connection(conn, "admin")
