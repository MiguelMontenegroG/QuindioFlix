"""Modelos Pydantic para Usuarios, Perfiles, Planes y Autenticacion."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ==================== PLANES ====================
class PlanBase(BaseModel):
    nombre_plan: str = Field(..., max_length=20)
    precio_mensual: float = Field(..., gt=0)
    num_pantallas: int = Field(..., ge=1, le=4)
    calidad_video: str = Field(..., pattern=r"^(SD|HD|4K)$")
    max_perfiles: int = Field(..., ge=2, le=5)


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    nombre_plan: Optional[str] = Field(None, max_length=20)
    precio_mensual: Optional[float] = Field(None, gt=0)
    num_pantallas: Optional[int] = Field(None, ge=1, le=4)
    calidad_video: Optional[str] = Field(None, pattern=r"^(SD|HD|4K)$")
    max_perfiles: Optional[int] = Field(None, ge=2, le=5)


class Plan(PlanBase):
    id_plan: int

    class Config:
        from_attributes = True


# ==================== USUARIOS ====================
class UsuarioBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    email: EmailStr
    telefono: str = Field(..., max_length=15)
    fecha_nacimiento: date
    ciudad: str = Field(..., max_length=80)
    id_plan: int
    codigo_referido: Optional[str] = None


class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6)


class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=15)
    ciudad: Optional[str] = Field(None, max_length=80)
    id_plan: Optional[int] = None


class Usuario(UsuarioBase):
    id_usuario: int
    estado_cuenta: str = "ACTIVO"
    fecha_registro: datetime
    es_admin: bool = False

    class Config:
        from_attributes = True


# ==================== PERFILES ====================
class PerfilBase(BaseModel):
    id_usuario: int
    nombre_perfil: str = Field(..., max_length=50)
    avatar: str = "default.png"
    tipo: str = Field(..., pattern=r"^(ADULTO|INFANTIL)$")


class PerfilCreate(PerfilBase):
    pass


class PerfilUpdate(BaseModel):
    nombre_perfil: Optional[str] = Field(None, max_length=50)
    avatar: Optional[str] = None
    tipo: Optional[str] = Field(None, pattern=r"^(ADULTO|INFANTIL)$")


class Perfil(PerfilBase):
    id_perfil: int

    class Config:
        from_attributes = True


# ==================== AUTENTICACION ====================
class Token(BaseModel):
    token: str
    usuario: Usuario
    perfiles: list[Perfil]


class TokenData(BaseModel):
    id_usuario: Optional[int] = None
    es_admin: bool = False


class LoginResponse(Token):
    pass


class RegistroResponse(BaseModel):
    usuario: Usuario
    mensaje: str


class CambiarPlanRequest(BaseModel):
    id_usuario: int
    id_plan: int


class CambiarEstadoRequest(BaseModel):
    estado: str = Field(..., pattern=r"^(ACTIVO|INACTIVO)$")
