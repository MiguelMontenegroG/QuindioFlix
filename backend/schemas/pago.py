"""Modelos Pydantic para Pagos."""

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class PagoBase(BaseModel):
    id_usuario: int
    monto: float = Field(..., gt=0)
    metodo_pago: str = Field(..., pattern=r"^(TARJETA_CREDITO|TARJETA_DEBITO|PSE|NEQUI|DAVIPLATA)$")
    fecha_vencimiento: date


class PagoCreate(PagoBase):
    estado_pago: str = Field(default="PENDIENTE", pattern=r"^(EXITOSO|FALLIDO|PENDIENTE|REEMBOLSADO)$")


class PagoUpdateEstado(BaseModel):
    estado: str = Field(..., pattern=r"^(EXITOSO|FALLIDO|PENDIENTE|REEMBOLSADO)$")


class Pago(PagoBase):
    id_pago: int
    fecha_pago: date
    estado_pago: str = "PENDIENTE"

    class Config:
        from_attributes = True
