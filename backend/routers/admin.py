"""Routers de administracion: empleados, planes, roles Oracle.
Todos los endpoints requieren autenticacion de administrador.
"""

from fastapi import APIRouter, HTTPException, Query, Depends

from database import get_connection, release_connection
from dependencies import get_current_admin
from schemas.usuario import Plan, PlanCreate, PlanUpdate, Usuario
from services.plan_service import listar_planes, obtener_plan

router = APIRouter(prefix="/admin", tags=["Administracion"], dependencies=[Depends(get_current_admin)])


# ==================== EMPLEADOS ====================

@router.get("/empleados")
def listar_empleados(
    departamento: str = Query(None),
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
):
    """Lista empleados con filtro por departamento."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        where = ""
        binds = {}
        if departamento:
            where = "WHERE d.nombre_depto = :depto"
            binds["depto"] = departamento

        # Total
        cursor.execute(
            f"SELECT COUNT(*) FROM EMPLEADOS e JOIN DEPARTAMENTOS d ON d.id_departamento = e.id_departamento {where}",
            binds
        )
        total = cursor.fetchone()[0]

        offset = (pagina - 1) * por_pagina
        sql = f"""
            SELECT * FROM (
                SELECT e.*, d.nombre_depto, ROWNUM rn
                FROM EMPLEADOS e
                JOIN DEPARTAMENTOS d ON d.id_departamento = e.id_departamento
                {where}
                ORDER BY e.nombre
            ) WHERE rn > :offset AND rn <= :limit
        """
        binds["offset"] = offset
        binds["limit"] = offset + por_pagina
        cursor.execute(sql, binds)

        columns = [desc[0] for desc in cursor.description]
        empleados = [dict(zip(columns, r)) for r in cursor]
        cursor.close()
        return {"data": empleados, "total": total}
    finally:
        release_connection(conn)


@router.get("/empleados/{id_empleado}")
def obtener_empleado(id_empleado: int):
    """Obtiene un empleado por ID."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT e.*, d.nombre_depto, sup.nombre AS nombre_supervisor
               FROM EMPLEADOS e
               JOIN DEPARTAMENTOS d ON d.id_departamento = e.id_departamento
               LEFT JOIN EMPLEADOS sup ON sup.id_empleado = e.id_supervisor
               WHERE e.id_empleado = :1""", [id_empleado]
        )
        row = cursor.fetchone()
        cursor.close()
        if not row:
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
        return {
            "id_empleado": row[0], "nombre": row[1], "email": row[2],
            "cargo": row[3], "fecha_contratacion": row[4],
            "id_departamento": row[5], "id_supervisor": row[6],
            "departamento": row[8], "supervisor": row[9]
        }
    except HTTPException:
        raise
    finally:
        release_connection(conn)


@router.post("/empleados", status_code=201)
def crear_empleado(data: dict):
    """Crea un nuevo empleado."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO EMPLEADOS (id_empleado, nombre, email, cargo, fecha_contratacion, id_departamento, id_supervisor)
               VALUES (seq_empleados.NEXTVAL, :1, :2, :3, :4, :5, :6)""",
            [data["nombre"], data["email"], data["cargo"],
             data["fecha_contratacion"], data["id_departamento"],
             data.get("id_supervisor")]
        )
        conn.commit()
        cursor.close()
        return {"mensaje": "Empleado creado exitosamente"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        release_connection(conn)


@router.put("/empleados/{id_empleado}")
def actualizar_empleado(id_empleado: int, data: dict):
    """Actualiza un empleado."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        updates = []
        binds = {"id": id_empleado}
        for field in ["nombre", "email", "cargo", "id_departamento", "id_supervisor"]:
            if field in data and data[field] is not None:
                updates.append(f"{field} = :{field}")
                binds[field] = data[field]
        if updates:
            cursor.execute(f"UPDATE EMPLEADOS SET {', '.join(updates)} WHERE id_empleado = :id", binds)
            if cursor.rowcount == 0:
                cursor.close()
                raise HTTPException(status_code=404, detail="Empleado no encontrado")
            conn.commit()
        cursor.close()
        return {"mensaje": "Empleado actualizado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        release_connection(conn)


@router.delete("/empleados/{id_empleado}")
def eliminar_empleado(id_empleado: int):
    """Elimina un empleado."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM EMPLEADOS WHERE id_empleado = :1", [id_empleado])
        if cursor.rowcount == 0:
            cursor.close()
            raise HTTPException(status_code=404, detail="Empleado no encontrado")
        conn.commit()
        cursor.close()
        return {"mensaje": "Empleado eliminado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        release_connection(conn)


# ==================== DEPARTAMENTOS ====================

@router.get("/departamentos")
def listar_departamentos():
    """Lista todos los departamentos."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """SELECT d.*, e.nombre AS jefe_nombre
               FROM DEPARTAMENTOS d
               LEFT JOIN EMPLEADOS e ON e.id_empleado = d.id_jefe
               ORDER BY d.nombre_depto"""
        )
        columns = [desc[0] for desc in cursor.description]
        deptos = [dict(zip(columns, r)) for r in cursor]
        cursor.close()
        return deptos
    finally:
        release_connection(conn)


# ==================== PLANES (admin) ====================

@router.put("/planes/{id_plan}", response_model=Plan)
def actualizar_plan_admin(id_plan: int, data: PlanUpdate):
    """Actualiza un plan (solo admin)."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        updates = []
        binds = {"id": id_plan}

        field_map = {
            "nombre_plan": "nombre_plan",
            "precio_mensual": "precio_mensual",
            "num_pantallas": "num_pantallas",
            "calidad_video": "calidad_video",
            "max_perfiles": "max_perfiles",
        }
        for field, col in field_map.items():
            value = getattr(data, field, None)
            if value is not None:
                updates.append(f"{col} = :{field}")
                binds[field] = value

        if updates:
            cursor.execute(f"UPDATE PLANES SET {', '.join(updates)} WHERE id_plan = :id", binds)
            if cursor.rowcount == 0:
                cursor.close()
                raise HTTPException(status_code=404, detail="Plan no encontrado")
            conn.commit()
        cursor.close()
        return obtener_plan(id_plan)
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        release_connection(conn)
