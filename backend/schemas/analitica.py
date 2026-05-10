"""Modelos Pydantic para Reportes Analiticos."""

from typing import Any, Optional

from pydantic import BaseModel


class KPIsDashboard(BaseModel):
    usuarios_activos: int
    ingresos_mes: float
    reproducciones_totales: int
    contenido_mas_popular: list[dict[str, Any]]
    crecimiento_usuarios: float
    tasa_conversion: float


class ConsumoPorCiudad(BaseModel):
    ciudad: str
    total_usuarios: int
    ingresos_totales: float
    plan_basico: int
    plan_estandar: int
    plan_premium: int


class ReproduccionesPorDispositivo(BaseModel):
    categoria: str
    celular: int = 0
    tablet: int = 0
    tv: int = 0
    computador: int = 0


class ReporteFinanciero(BaseModel):
    ciudad: str
    plan: str
    ingresos: float
    usuarios: int
    mes: str


class ContenidoPopular(BaseModel):
    id_contenido: int
    titulo: str
    total_reproducciones: int
    promedio_avance: float
    calificacion_promedio: float


class ReporteEquipo(BaseModel):
    departamento: str
    total_empleados: int
    empleados_con_supervisor: int
    empleados_sin_supervisor: int


class EstadisticasModeracion(BaseModel):
    total_reportes: int
    pendientes: int
    resueltos: int
    rechazados: int
    tiempo_promedio_resolucion_horas: Optional[float] = None
