// ============================================
// Planes de suscripción
// ============================================
export const PLANES = {
  BASICO: { id: 1, nombre: 'Basico', precio: 14900, maxPerfiles: 2, maxPantallas: 1, calidad: 'SD' },
  ESTANDAR: { id: 2, nombre: 'Estandar', precio: 24900, maxPerfiles: 3, maxPantallas: 2, calidad: 'HD' },
  PREMIUM: { id: 3, nombre: 'Premium', precio: 34900, maxPerfiles: 5, maxPantallas: 4, calidad: '4K' },
} as const

// ============================================
// Categorías de contenido
// ============================================
export const CATEGORIAS = [
  { value: 'película', label: 'Películas' },
  { value: 'serie', label: 'Series' },
  { value: 'documental', label: 'Documentales' },
  { value: 'música', label: 'Música' },
  { value: 'podcast', label: 'Podcasts' },
] as const

// ============================================
// Clasificaciones de edad
// ============================================
export const CLASIFICACIONES = [
  { value: 'TP', label: 'TP - Todo Público', color: 'bg-green-500/80' },
  { value: '+7', label: '+7 años', color: 'bg-green-600/80' },
  { value: '+13', label: '+13 años', color: 'bg-yellow-500/80' },
  { value: '+16', label: '+16 años', color: 'bg-orange-500/80' },
  { value: '+18', label: '+18 años', color: 'bg-red-500/80' },
] as const

// ============================================
// Estados de contenido
// ============================================
export const ESTADOS_CONTENIDO = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'publicado', label: 'Publicado' },
  { value: 'archivado', label: 'Archivado' },
] as const

// ============================================
// Métodos de pago
// ============================================
export const METODOS_PAGO = [
  { value: 'tarjeta_credito', label: 'Tarjeta de crédito' },
  { value: 'tarjeta_debito', label: 'Tarjeta débito' },
  { value: 'pse', label: 'PSE' },
  { value: 'efectivo', label: 'Efectivo' },
] as const

// ============================================
// Estados de pago
// ============================================
export const ESTADOS_PAGO = [
  { value: 'exitoso', label: 'Exitoso', color: 'text-green-500 bg-green-500/20' },
  { value: 'fallido', label: 'Fallido', color: 'text-red-500 bg-red-500/20' },
  { value: 'pendiente', label: 'Pendiente', color: 'text-yellow-500 bg-yellow-500/20' },
  { value: 'reembolsado', label: 'Reembolsado', color: 'text-blue-500 bg-blue-500/20' },
] as const

// ============================================
// Motivos de reporte
// ============================================
export const MOTIVOS_REPORTE = [
  { value: 'contenido_inapropiado', label: 'Contenido inapropiado' },
  { value: 'error_tecnico', label: 'Error técnico' },
  { value: 'derechos_autor', label: 'Derechos de autor' },
  { value: 'spam', label: 'Spam' },
  { value: 'otro', label: 'Otro' },
] as const

// ============================================
// Departamentos de empleados
// ============================================
export const DEPARTAMENTOS = [
  { value: 'Contenido', label: 'Contenido' },
  { value: 'Soporte', label: 'Soporte' },
  { value: 'Moderación', label: 'Moderación' },
  { value: 'Administración', label: 'Administración' },
] as const

// ============================================
// Roles Oracle
// ============================================
export const ROLES_ORACLE = [
  { value: 'ROL_ADMIN', label: 'Administrador' },
  { value: 'ROL_ANALISTA', label: 'Analista' },
  { value: 'ROL_SOPORTE', label: 'Soporte' },
  { value: 'ROL_CONTENIDO', label: 'Contenido' },
] as const

// ============================================
// Tipos de relación entre contenido
// ============================================
export const TIPOS_RELACION = [
  { value: 'secuela', label: 'Secuela' },
  { value: 'precuela', label: 'Precuela' },
  { value: 'remake', label: 'Remake' },
  { value: 'spin-off', label: 'Spin-off' },
  { value: 'version_extendida', label: 'Versión extendida' },
] as const

// ============================================
// Ciudades colombianas para el registro
// ============================================
export const CIUDADES_COLOMBIA = [
  'Armenia', 'Pereira', 'Manizales', 'Bogotá', 'Medellín',
  'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Ibagué',
  'Santa Marta', 'Cúcuta', 'Neiva', 'Popayán', 'Sincelejo',
  'Villavicencio', 'Pasto', 'Montería', 'Valledupar', 'Riohacha',
]

// ============================================
// Tipos de dispositivos para reproducción
// ============================================
export const DISPOSITIVOS = ['web', 'mobile', 'tv', 'tablet'] as const

// ============================================
// Configuración de la aplicación
// ============================================
export const APP_CONFIG = {
  nombre: 'QuindioFlix',
  slogan: 'Streaming colombiano con sabor a café',
  email: 'contacto@quindioflix.com',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  maxCarouselItems: 10,
  reprodutorPollInterval: 10000, // 10 segundos para reportar avance
} as const
