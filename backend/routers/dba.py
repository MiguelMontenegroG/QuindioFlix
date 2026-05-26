"""Routers DBA: transacciones, EXPLAIN PLAN, SQL directo, vistas materializadas, tablespaces.
"""

from fastapi import APIRouter, HTTPException, Depends, Query

from backend.dependencies import require_roles
from backend.services.dba_service import (
    transacciones_activas, explain_plan, vistas_materializadas,
    refrescar_vista, tablespaces, ejecutar_renovacion_mensual,
    ejecutar_consulta_sql, tablespaces_reproducciones,
    vistas_materializadas_detalle, refrescar_vista_por_nombre,
)

router = APIRouter(prefix="/dba", tags=["Herramientas DBA"])


@router.get("/transacciones")
def obtener_transacciones():
    """Obtiene transacciones activas y bloqueos en Oracle."""
    return transacciones_activas()


@router.post("/explain-plan")
def analizar_query(data: dict):
    """Ejecuta EXPLAIN PLAN para una consulta SQL."""
    if "query" not in data or not data["query"].strip():
        raise HTTPException(status_code=400, detail="Se requiere una consulta SQL")
    resultado = explain_plan(data["query"])
    return {"query": data["query"], "plan": resultado}


@router.post("/query")
def consultar_sql(data: dict, limite: int = Query(100, ge=1, le=5000)):
    """Ejecuta una consulta SQL SELECT directamente (SOLO LECTURA).

    Permite hacer consultas ad-hoc para verificar datos en Oracle.
    Solo acepta SELECT, no permite INSERT/UPDATE/DELETE.
    El parametro 'query' debe ser una sentencia SELECT valida.
    """
    query = data.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Se requiere una consulta SQL")

    query_upper = query.upper().strip()
    if not query_upper.startswith("SELECT"):
        raise HTTPException(status_code=400, detail="Solo se permiten consultas SELECT")

    resultado = ejecutar_consulta_sql(query, limite)
    if "error" in resultado:
        raise HTTPException(status_code=400, detail=resultado["error"])
    return resultado


@router.get("/vistas-materializadas")
def obtener_vistas():
    """Obtiene informacion de vistas materializadas."""
    return vistas_materializadas()


@router.post("/vistas-materializadas/{nombre}/refrescar")
def refrescar_vista_endpoint(nombre: str):
    """Refresca una vista materializada."""
    resultado = refrescar_vista(nombre)
    if "error" in resultado:
        raise HTTPException(status_code=400, detail=resultado["error"])
    return resultado


@router.get("/tablespaces")
def obtener_tablespaces():
    """Obtiene informacion de tablespaces y su uso."""
    return tablespaces()


@router.post("/renovacion-mensual")
def renovacion_mensual():
    """Ejecuta el proceso de renovacion mensual de suscripciones."""
    try:
        return ejecutar_renovacion_mensual()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# NUEVOS ENDPOINTS — Tablas particionadas y Vistas Materializadas (DBA)
# =============================================================================

@router.get("/tablespaces-detalle")
def obtener_tablespaces_reproducciones():
    """Obtiene informacion detallada de TS_REPROD_2024 y TS_REPROD_2025.

    Retorna nombre, tamanio, usado, libre y porcentaje de uso de los
    tablespaces creados para la tabla particionada REPRODUCCIONES_PART.
    """
    resultado = tablespaces_reproducciones()
    if not resultado:
        return {"data": [], "mensaje": "No se encontraron los tablespaces de reproducciones. Ejecute sql/10_tablespaces_particiones.sql"}
    return {"data": resultado}


@router.get("/vistas-materializadas-detalle")
def obtener_vistas_detalle():
    """Obtiene informacion detallada de todas las MVs del esquema.

    Similar a /vistas-materializadas pero con campos adicionales:
    metodo_refresh, propietario, filas_estimadas.
    """
    return vistas_materializadas_detalle()


@router.post("/vistas-materializadas/refresh")
def refrescar_vista_por_nombre_endpoint(data: dict):
    """Refresca una vista materializada especifica.

    Recibe en el body: { "nombre": "MV_POPULARIDAD_CONTENIDO" }
    Ejecuta DBMS_MVIEW.REFRESH con metodo 'C' (COMPLETE).
    """
    resultado = refrescar_vista_por_nombre(data)
    if "error" in resultado:
        raise HTTPException(status_code=400, detail=resultado["error"])
    return resultado
