"""Router de monitoreo en tiempo real de la base de datos.

Proporciona un endpoint SSE que emite actualizaciones periodicas
con las metricas principales de Oracle.
"""

import asyncio
import json

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from ..services.monitor_service import (
    obtener_estadisticas_generales,
    obtener_ultimos_registros,
)

router = APIRouter(
    prefix="/monitor",
    tags=["Monitor Tiempo Real"],
)


@router.get("/stream")
async def monitor_stream():
    """Endpoint SSE que emite metricas de la BD cada 3 segundos.

    Eventos:
    - stats: metricas generales (usuarios, contenido, ingresos, etc.)
    - activity: ultimos registros de actividad en el sistema
    """

    async def event_generator():
        try:
            while True:
                try:
                    stats = obtener_estadisticas_generales()
                    yield {
                        "event": "stats",
                        "data": json.dumps(stats, default=str),
                    }

                    activity = obtener_ultimos_registros()
                    yield {
                        "event": "activity",
                        "data": json.dumps(activity, default=str),
                    }

                except Exception as e:
                    yield {
                        "event": "error",
                        "data": json.dumps({"mensaje": str(e)}),
                    }

                await asyncio.sleep(3)

        except asyncio.CancelledError:
            pass

    return EventSourceResponse(event_generator())
