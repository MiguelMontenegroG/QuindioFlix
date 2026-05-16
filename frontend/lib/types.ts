// Tipos de usuario y autenticación
export interface Usuario {
  id: number
  nombre: string
  email: string
  telefono?: string
  ciudad?: string
  fecha_nacimiento?: string
  id_plan: number
  estado: 'activo' | 'inactivo' | 'ACTIVO' | 'INACTIVO'
  codigo_referido?: string
  fecha_registro: string
  es_admin?: boolean
  role?: 'admin' | 'analista' | 'soporte' | 'contenido' | 'usuario'
  plan?: { id: number; nombre: string }
}

export interface Perfil {
  id: number
  id_usuario: number
  nombre: string
  avatar?: string
  es_infantil: boolean
  pin?: string
}

export interface Plan {
  id: number
  nombre: 'Básico' | 'Estándar' | 'Premium'
  precio: number
  max_pantallas: number
  calidad: 'HD' | 'Full HD' | '4K'
  max_perfiles: number
  descripcion?: string
}

// Tipos de contenido
export type CategoriaContenido = 'Pelicula' | 'Serie' | 'Documental' | 'Musica' | 'Podcast'
export type ClasificacionEdad = 'TP' | '+7' | '+13' | '+16' | '+18'
export type EstadoContenido = 'borrador' | 'publicado' | 'archivado'

export interface Genero {
  id: number
  nombre: string
}

export interface Contenido {
  id: number
  titulo: string
  sinopsis: string
  año: number
  duracion_minutos?: number
  clasificacion_edad: ClasificacionEdad
  categoria: CategoriaContenido
  generos: Genero[]
  poster_url: string
  banner_url?: string
  trailer_url?: string
  es_original: boolean
  estado: EstadoContenido
  calificacion_promedio?: number
  total_reproducciones?: number
  fecha_publicacion?: string
}

export interface Temporada {
  id: number
  id_contenido: number
  numero: number
  titulo?: string
  sinopsis?: string
  año: number
  episodios: Episodio[]
}

export interface Episodio {
  id: number
  id_temporada: number
  numero: number
  titulo: string
  sinopsis?: string
  duracion_minutos: number
  video_url: string
  thumbnail_url?: string
}

export interface ContenidoRelacionado {
  id: number
  id_contenido_origen: number
  id_contenido_destino: number
  tipo_relacion: 'secuela' | 'precuela' | 'remake' | 'spin-off' | 'version_extendida'
  contenido_destino?: Contenido
}

// Tipos de reproducción y favoritos
export interface Reproduccion {
  id: number
  id_reproduccion?: number
  id_perfil: number
  id_contenido: number
  id_episodio?: number
  fecha_inicio: string
  fecha_fin?: string
  porcentaje_avance: number
  dispositivo: string
  contenido?: Contenido
}

export interface Favorito {
  id: number
  id_perfil: number
  id_contenido: number
  fecha_agregado: string
  contenido?: Contenido
}

export interface Calificacion {
  id: number
  id_perfil: number
  id_contenido: number
  puntuacion: number // 1-5
  reseña?: string
  fecha: string
}

// Tipos de reportes y moderación
export type EstadoReporte = 'pendiente' | 'resuelto' | 'rechazado'
export type MotivoReporte = 'contenido_inapropiado' | 'error_tecnico' | 'derechos_autor' | 'spam' | 'otro'

export interface Reporte {
  id: number
  id_perfil: number
  id_contenido: number
  motivo: MotivoReporte
  descripcion?: string
  estado: EstadoReporte
  fecha_creacion: string
  fecha_resolucion?: string
  id_moderador?: number
  comentario_moderador?: string
  contenido?: Contenido
  perfil?: Perfil
}

// Tipos de pagos
export type EstadoPago = 'exitoso' | 'fallido' | 'pendiente' | 'reembolsado'
export type MetodoPago = 'tarjeta_credito' | 'tarjeta_debito' | 'pse' | 'efectivo'

export interface Pago {
  id: number
  id_usuario: number
  monto: number
  fecha: string
  metodo: MetodoPago
  estado: EstadoPago
  referencia?: string
}

// Tipos de empleados
export type Departamento = string
export type RolOracle = 'ROL_ADMIN' | 'ROL_ANALISTA' | 'ROL_SOPORTE' | 'ROL_CONTENIDO'

export interface Empleado {
  id: number
  nombre: string
  email: string
  cargo?: string
  fecha_contratacion?: string
  id_departamento?: number
  id_supervisor?: number | null
  departamento?: string
  supervisor?: string
}

// Tipos de referidos
export interface Referido {
  id: number
  id_usuario_referidor: number
  id_usuario_referido: number
  fecha: string
  descuento_aplicado: number
  usuario_referido?: Usuario
}

// Tipos para reportes analíticos
export interface KPIsDashboard {
  usuarios_activos: number
  ingresos_mensuales?: number
  ingresos_mes?: number
  total_reproducciones?: number
  reproducciones_totales?: number
  contenido_total?: number
  contenido_mas_popular?: Contenido[]
  crecimiento_usuarios?: number
  reportes_pendientes?: number
  tasa_conversion?: number
}

export interface ConsumoPorCiudad {
  ciudad: string
  plan_basico: number
  plan_estandar: number
  plan_premium: number
  total: number
}

export interface ReproduccionesPorDispositivo {
  categoria: CategoriaContenido
  web: number
  mobile: number
  tv: number
  tablet: number
}

export interface ReporteFinanciero {
  ciudad: string
  plan: string
  ingresos: number
  usuarios: number
  mes: string
}

// Tipos para herramientas DBA
export interface TransaccionActiva {
  id: string
  usuario: string
  tabla: string
  tipo_bloqueo: string
  inicio: string
  estado: string
}

export interface ExplainPlan {
  operacion: string
  nombre_objeto?: string
  costo: number
  filas: number
  tiempo?: number
}

export interface VistaMaterializada {
  nombre: string
  ultima_actualizacion: string
  estado: 'válida' | 'inválida'
  modo_refresh: 'manual' | 'automático'
  filas: number
}

export interface Tablespace {
  nombre: string
  tamaño_mb: number
  usado_mb: number
  libre_mb: number
  porcentaje_usado: number
}

// Tipos de autenticación
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  usuario: Usuario
  perfiles: Perfil[]
}

export interface RegistroRequest {
  nombre: string
  email: string
  password: string
  telefono?: string
  ciudad?: string
  fecha_nacimiento?: string
  id_plan: number
  codigo_referido?: string
}

// Tipos de navegación y sesión
export interface SessionData {
  usuario: Usuario
  perfil_activo: Perfil | null
  token: string
}

// Tipos de respuesta API
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  pagina: number
  por_pagina: number
  total_paginas: number
}
