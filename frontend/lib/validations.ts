import { z } from 'zod'

// ============================================
// Validaciones de autenticación
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const registroSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  telefono: z.string().optional(),
  ciudad: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  id_plan: z.number().int().min(1, 'Debes seleccionar un plan'),
  codigo_referido: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export const recuperarPasswordSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
})

// ============================================
// Validaciones de perfiles
// ============================================

export const perfilSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(50, 'Máximo 50 caracteres'),
  es_infantil: z.boolean(),
  pin: z.string().length(4, 'El PIN debe tener 4 dígitos').optional(),
})

// Validación de límite de perfiles según plan
export const MAX_PERFILES_POR_PLAN = {
  1: 2, // Básico
  2: 3, // Estándar
  3: 5, // Premium
} as const

export function validarLimitePerfiles(
  idPlan: number,
  perfilesActuales: number,
  nuevosPerfiles: number = 1
): { valido: boolean; mensaje?: string } {
  const maxPerfiles = MAX_PERFILES_POR_PLAN[idPlan as keyof typeof MAX_PERFILES_POR_PLAN] || 2
  const totalDespues = perfilesActuales + nuevosPerfiles

  if (totalDespues > maxPerfiles) {
    return {
      valido: false,
      mensaje: `Tu plan solo permite ${maxPerfiles} perfiles. Actualmente tienes ${perfilesActuales} perfil(es). Elimina algunos perfiles o cambia de plan.`,
    }
  }

  return { valido: true }
}

// ============================================
// Validaciones de contenido
// ============================================

// Clasificaciones de edad permitidas para perfiles infantiles
export const CLASIFICACIONES_INFANTILES = ['TP', '+7', '+13'] as const

export function filtrarContenidoInfantil(clasificacion: string): boolean {
  return CLASIFICACIONES_INFANTILES.includes(clasificacion as any)
}

// ============================================
// Validaciones de calificación
// ============================================

export const calificacionSchema = z.object({
  id_perfil: z.number().int(),
  id_contenido: z.number().int(),
  puntuacion: z.number().int().min(1, 'Debes seleccionar al menos 1 estrella').max(5, 'Máximo 5 estrellas'),
  reseña: z.string().max(500, 'La reseña no puede exceder 500 caracteres').optional(),
})

// Validación de porcentaje de avance (Oracle valida con trigger)
export function validarAvanceParaCalificar(porcentajeAvance: number): boolean {
  return porcentajeAvance >= 50
}

// ============================================
// Validaciones de cambio de plan
// ============================================

export function validarCambioPlan(
  idPlanActual: number,
  idPlanNuevo: number,
  perfilesActivos: number
): { valido: boolean; mensaje?: string; perfilesExcedentes?: number } {
  const maxPerfilesNuevo = MAX_PERFILES_POR_PLAN[idPlanNuevo as keyof typeof MAX_PERFILES_POR_PLAN]

  if (perfilesActivos > maxPerfilesNuevo) {
    const excedentes = perfilesActivos - maxPerfilesNuevo
    return {
      valido: false,
      mensaje: `El plan seleccionado permite ${maxPerfilesNuevo} perfiles, pero actualmente tienes ${perfilesActivos} perfiles activos. Debes eliminar ${excedentes} perfil(es) antes de cambiar de plan.`,
      perfilesExcedentes: excedentes,
    }
  }

  return { valido: true }
}

// ============================================
// Validaciones de reportes
// ============================================

export const reporteSchema = z.object({
  id_perfil: z.number().int(),
  id_contenido: z.number().int(),
  motivo: z.enum(['contenido_inapropiado', 'error_tecnico', 'derechos_autor', 'spam', 'otro'], {
    errorMap: () => ({ message: 'Selecciona un motivo válido' }),
  }),
  descripcion: z.string().max(1000, 'La descripción no puede exceder 1000 caracteres').optional(),
})

// ============================================
// Validaciones de pago
// ============================================

export const METODOS_PAGO = ['tarjeta_credito', 'tarjeta_debito', 'pse', 'efectivo'] as const

export const ESTADOS_PAGO = ['exitoso', 'fallido', 'pendiente', 'reembolsado'] as const

// ============================================
// Helper: Obtener alerta de cuenta inactiva
// ============================================

export function validarCuentaActiva(
  estado: 'activo' | 'inactivo',
  diasSinPago?: number
): { activa: boolean; mensaje?: string } {
  if (estado === 'inactivo' || (diasSinPago && diasSinPago > 30)) {
    return {
      activa: false,
      mensaje: 'Tu cuenta está inactiva. Realiza un pago para reactivar tu suscripción y poder reproducir contenido.',
    }
  }
  return { activa: true }
}

// ============================================
// Tipos derivados
// ============================================

export type LoginFormData = z.infer<typeof loginSchema>
export type RegistroFormData = z.infer<typeof registroSchema>
export type PerfilFormData = z.infer<typeof perfilSchema>
export type CalificacionFormData = z.infer<typeof calificacionSchema>
export type ReporteFormData = z.infer<typeof reporteSchema>
