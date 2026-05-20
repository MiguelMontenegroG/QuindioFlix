import type {
  Usuario,
  Perfil,
  Plan,
  Contenido,
  Genero,
  Temporada,
  Pago,
  Reporte,
  Empleado,
  Referido,
  Reproduccion,
  Favorito,
} from './types'

// ==================== PLANES ====================
export const mockPlanes: Plan[] = [
  {
    id: 1,
    nombre: 'Básico',
    precio: 17900,
    max_pantallas: 1,
    calidad: 'HD',
    max_perfiles: 2,
    descripcion: 'Ideal para una persona. Contenido en HD.',
  },
  {
    id: 2,
    nombre: 'Estándar',
    precio: 33900,
    max_pantallas: 2,
    calidad: 'Full HD',
    max_perfiles: 3,
    descripcion: 'Perfecto para parejas. Contenido en Full HD.',
  },
  {
    id: 3,
    nombre: 'Premium',
    precio: 49900,
    max_pantallas: 4,
    calidad: '4K',
    max_perfiles: 5,
    descripcion: 'Para toda la familia. Contenido en 4K Ultra HD.',
  },
]

// ==================== GÉNEROS ====================
export const mockGeneros: Genero[] = [
  { id: 1, nombre: 'Acción' },
  { id: 2, nombre: 'Comedia' },
  { id: 3, nombre: 'Drama' },
  { id: 4, nombre: 'Terror' },
  { id: 5, nombre: 'Ciencia Ficción' },
  { id: 6, nombre: 'Romance' },
  { id: 7, nombre: 'Documental' },
  { id: 8, nombre: 'Animación' },
  { id: 9, nombre: 'Thriller' },
  { id: 10, nombre: 'Musical' },
  { id: 11, nombre: 'Aventura' },
  { id: 12, nombre: 'Familiar' },
]

// ==================== USUARIOS ====================
export const mockUsuario: Usuario = {
  id: 1,
  nombre: 'Juan Carlos Rodríguez',
  email: 'juan.rodriguez@email.com',
  telefono: '3001234567',
  ciudad: 'Armenia',
  fecha_nacimiento: '1990-05-15',
  id_plan: 2,
  estado: 'activo',
  codigo_referido: 'JUAN2024',
  fecha_registro: '2024-01-15',
}

// ==================== PERFILES ====================
export const mockPerfiles: Perfil[] = [
  {
    id: 1,
    id_usuario: 1,
    nombre: 'Juan',
    avatar: '/avatars/avatar-1.jpg',
    es_infantil: false,
  },
  {
    id: 2,
    id_usuario: 1,
    nombre: 'María',
    avatar: '/avatars/avatar-2.jpg',
    es_infantil: false,
  },
  {
    id: 3,
    id_usuario: 1,
    nombre: 'Niños',
    avatar: '/avatars/avatar-kids.jpg',
    es_infantil: true,
  },
]

// ==================== CONTENIDO ====================
export const mockContenido: Contenido[] = [
  {
    id: 1,
    titulo: 'El Abrazo de la Serpiente',
    sinopsis: 'Un chamán amazónico y un etnobotánico emprenden un viaje por el río Amazonas en busca de una planta sagrada que puede curar al científico.',
    año: 2015,
    duracion_minutos: 125,
    clasificacion_edad: '+13',
    categoria: 'Pelicula',
    generos: [{ id: 3, nombre: 'Drama' }, { id: 11, nombre: 'Aventura' }],
    poster_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=800&fit=crop',
    es_original: false,
    estado: 'publicado',
    calificacion_promedio: 4.7,
    total_reproducciones: 15420,
    fecha_publicacion: '2024-01-01',
  },
  {
    id: 2,
    titulo: 'Pájaros de Verano',
    sinopsis: 'Durante la bonanza marimbera de los años 70 en Colombia, una familia indígena Wayuu se ve envuelta en el tráfico de marihuana.',
    año: 2018,
    duracion_minutos: 125,
    clasificacion_edad: '+16',
    categoria: 'Pelicula',
    generos: [{ id: 3, nombre: 'Drama' }, { id: 9, nombre: 'Thriller' }],
    poster_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&h=800&fit=crop',
    es_original: false,
    estado: 'publicado',
    calificacion_promedio: 4.5,
    total_reproducciones: 12350,
    fecha_publicacion: '2024-02-15',
  },
  {
    id: 3,
    titulo: 'Betty la Fea',
    sinopsis: 'Beatriz Aurora Pinzón Solano es una joven brillante pero poco agraciada que trabaja en una prestigiosa empresa de moda.',
    año: 1999,
    duracion_minutos: 45,
    clasificacion_edad: 'TP',
    categoria: 'Serie',
    generos: [{ id: 2, nombre: 'Comedia' }, { id: 6, nombre: 'Romance' }],
    poster_url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&h=600&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=1920&h=800&fit=crop',
    es_original: false,
    estado: 'publicado',
    calificacion_promedio: 4.8,
    total_reproducciones: 89420,
    fecha_publicacion: '2024-01-01',
  },
  {
    id: 4,
    titulo: 'Colombia Salvaje',
    sinopsis: 'Un recorrido por los ecosistemas más impresionantes de Colombia, desde la Sierra Nevada hasta el Amazonas.',
    año: 2023,
    duracion_minutos: 90,
    clasificacion_edad: 'TP',
    categoria: 'Documental',
    generos: [{ id: 7, nombre: 'Documental' }],
    poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920&h=800&fit=crop',
    es_original: true,
    estado: 'publicado',
    calificacion_promedio: 4.9,
    total_reproducciones: 45230,
    fecha_publicacion: '2024-03-01',
  },
  {
    id: 5,
    titulo: 'Encanto',
    sinopsis: 'La familia Madrigal vive escondida en las montañas de Colombia en una casa mágica, en un pueblo vibrante, en un lugar encantador.',
    año: 2021,
    duracion_minutos: 102,
    clasificacion_edad: 'TP',
    categoria: 'Pelicula',
    generos: [{ id: 8, nombre: 'Animación' }, { id: 12, nombre: 'Familiar' }, { id: 10, nombre: 'Musical' }],
    poster_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1920&h=800&fit=crop',
    es_original: false,
    estado: 'publicado',
    calificacion_promedio: 4.6,
    total_reproducciones: 67890,
    fecha_publicacion: '2024-01-15',
  },
  {
    id: 6,
    titulo: 'Narcos',
    sinopsis: 'La historia del narcotraficante Pablo Escobar y los agentes de la DEA que lo persiguen.',
    año: 2015,
    duracion_minutos: 55,
    clasificacion_edad: '+18',
    categoria: 'Serie',
    generos: [{ id: 3, nombre: 'Drama' }, { id: 9, nombre: 'Thriller' }, { id: 1, nombre: 'Acción' }],
    poster_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1920&h=800&fit=crop',
    es_original: false,
    estado: 'publicado',
    calificacion_promedio: 4.4,
    total_reproducciones: 95000,
    fecha_publicacion: '2024-02-01',
  },
  {
    id: 7,
    titulo: 'La Vendedora de Rosas',
    sinopsis: 'Una niña de la calle en Medellín lucha por sobrevivir vendiendo rosas mientras enfrenta la dura realidad de la vida urbana.',
    año: 1998,
    duracion_minutos: 115,
    clasificacion_edad: '+16',
    categoria: 'Pelicula',
    generos: [{ id: 3, nombre: 'Drama' }],
    poster_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&h=600&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1920&h=800&fit=crop',
    es_original: false,
    estado: 'publicado',
    calificacion_promedio: 4.3,
    total_reproducciones: 8900,
    fecha_publicacion: '2024-04-01',
  },
  {
    id: 8,
    titulo: 'Café Quindío Sessions',
    sinopsis: 'Sesiones musicales en vivo grabadas en las fincas cafeteras del Quindío con artistas colombianos emergentes.',
    año: 2024,
    duracion_minutos: 60,
    clasificacion_edad: 'TP',
    categoria: 'Musica',
    generos: [{ id: 10, nombre: 'Musical' }],
    poster_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&h=800&fit=crop',
    es_original: true,
    estado: 'publicado',
    calificacion_promedio: 4.8,
    total_reproducciones: 23400,
    fecha_publicacion: '2024-05-01',
  },
  {
    id: 9,
    titulo: 'Voces del Eje Cafetero',
    sinopsis: 'Podcast semanal que explora las historias, tradiciones y personajes del Eje Cafetero colombiano.',
    año: 2024,
    duracion_minutos: 45,
    clasificacion_edad: 'TP',
    categoria: 'Podcast',
    generos: [{ id: 7, nombre: 'Documental' }],
    poster_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=600&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1920&h=800&fit=crop',
    es_original: true,
    estado: 'publicado',
    calificacion_promedio: 4.7,
    total_reproducciones: 18700,
    fecha_publicacion: '2024-03-15',
  },
  {
    id: 10,
    titulo: 'Monos',
    sinopsis: 'Un grupo de adolescentes soldados en la cima de una montaña colombiana viven una experiencia límite.',
    año: 2019,
    duracion_minutos: 102,
    clasificacion_edad: '+16',
    categoria: 'Pelicula',
    generos: [{ id: 3, nombre: 'Drama' }, { id: 9, nombre: 'Thriller' }],
    poster_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1920&h=800&fit=crop',
    es_original: false,
    estado: 'publicado',
    calificacion_promedio: 4.5,
    total_reproducciones: 11200,
    fecha_publicacion: '2024-04-15',
  },
]

// ==================== TEMPORADAS ====================
export const mockTemporadas: Temporada[] = [
  {
    id: 1,
    id_contenido: 3, // Betty la Fea
    numero: 1,
    titulo: 'Primera Temporada',
    sinopsis: 'Betty llega a Ecomoda y conoce a Don Armando.',
    año: 1999,
    episodios: [
      { id: 1, id_temporada: 1, numero: 1, titulo: 'El comienzo', duracion_minutos: 45, video_url: '/videos/betty-1-1.mp4' },
      { id: 2, id_temporada: 1, numero: 2, titulo: 'Nuevo trabajo', duracion_minutos: 45, video_url: '/videos/betty-1-2.mp4' },
      { id: 3, id_temporada: 1, numero: 3, titulo: 'El cuartel de las feas', duracion_minutos: 45, video_url: '/videos/betty-1-3.mp4' },
    ],
  },
  {
    id: 2,
    id_contenido: 6, // Narcos
    numero: 1,
    titulo: 'Primera Temporada',
    sinopsis: 'El ascenso de Pablo Escobar.',
    año: 2015,
    episodios: [
      { id: 4, id_temporada: 2, numero: 1, titulo: 'Descenso', duracion_minutos: 55, video_url: '/videos/narcos-1-1.mp4' },
      { id: 5, id_temporada: 2, numero: 2, titulo: 'El patrón', duracion_minutos: 55, video_url: '/videos/narcos-1-2.mp4' },
      { id: 6, id_temporada: 2, numero: 3, titulo: 'Los hombres de siempre', duracion_minutos: 55, video_url: '/videos/narcos-1-3.mp4' },
    ],
  },
]

// ==================== PAGOS ====================
export const mockPagos: Pago[] = [
  { id: 1, id_usuario: 1, monto: 33900, fecha: '2024-05-01', metodo: 'tarjeta_credito', estado: 'exitoso', referencia: 'PAY-001' },
  { id: 2, id_usuario: 1, monto: 33900, fecha: '2024-04-01', metodo: 'tarjeta_credito', estado: 'exitoso', referencia: 'PAY-002' },
  { id: 3, id_usuario: 1, monto: 33900, fecha: '2024-03-01', metodo: 'pse', estado: 'exitoso', referencia: 'PAY-003' },
  { id: 4, id_usuario: 1, monto: 33900, fecha: '2024-02-01', metodo: 'tarjeta_debito', estado: 'fallido', referencia: 'PAY-004' },
]

// ==================== REPORTES ====================
export const mockReportes: Reporte[] = [
  {
    id: 1,
    id_perfil: 1,
    id_contenido: 6,
    motivo: 'contenido_inapropiado',
    descripcion: 'Escena muy violenta sin advertencia previa',
    estado: 'pendiente',
    fecha_creacion: '2024-05-10',
  },
  {
    id: 2,
    id_perfil: 2,
    id_contenido: 7,
    motivo: 'error_tecnico',
    descripcion: 'El video se congela en el minuto 45',
    estado: 'resuelto',
    fecha_creacion: '2024-05-08',
    fecha_resolucion: '2024-05-09',
    id_moderador: 1,
    comentario_moderador: 'Video recodificado y actualizado',
  },
]

// ==================== EMPLEADOS ====================
export const mockEmpleados: Empleado[] = [
  { id: 1, nombre: 'Ana García', email: 'ana.garcia@quindioflix.com', departamento: 'Moderación', cargo: 'Moderador', fecha_contratacion: '2023-01-15' },
  { id: 2, nombre: 'Carlos López', email: 'carlos.lopez@quindioflix.com', departamento: 'Contenido', cargo: 'Editor', fecha_contratacion: '2023-03-20' },
  { id: 3, nombre: 'María Rodríguez', email: 'maria.rodriguez@quindioflix.com', departamento: 'Soporte', cargo: 'Agente', fecha_contratacion: '2023-06-10' },
  { id: 4, nombre: 'Pedro Martínez', email: 'pedro.martinez@quindioflix.com', departamento: 'Administración', cargo: 'Administrador', fecha_contratacion: '2022-08-01' },
]

// ==================== REFERIDOS ====================
export const mockReferidos: Referido[] = [
  { id: 1, id_usuario_referidor: 1, id_usuario_referido: 5, fecha: '2024-03-15', descuento_aplicado: 5000 },
  { id: 2, id_usuario_referidor: 1, id_usuario_referido: 6, fecha: '2024-04-20', descuento_aplicado: 5000 },
]

// ==================== REPRODUCCIONES ====================
export const mockReproducciones: Reproduccion[] = [
  { id: 1, id_perfil: 1, id_contenido: 1, fecha_inicio: '2024-05-10T20:00:00', fecha_fin: '2024-05-10T22:05:00', porcentaje_avance: 100, dispositivo: 'web' },
  { id: 2, id_perfil: 1, id_contenido: 3, id_episodio: 1, fecha_inicio: '2024-05-11T19:00:00', porcentaje_avance: 65, dispositivo: 'mobile' },
  { id: 3, id_perfil: 1, id_contenido: 5, fecha_inicio: '2024-05-09T15:00:00', fecha_fin: '2024-05-09T16:42:00', porcentaje_avance: 100, dispositivo: 'tv' },
]

// ==================== FAVORITOS ====================
export const mockFavoritos: Favorito[] = [
  { id: 1, id_perfil: 1, id_contenido: 1, fecha_agregado: '2024-05-10' },
  { id: 2, id_perfil: 1, id_contenido: 4, fecha_agregado: '2024-05-08' },
  { id: 3, id_perfil: 1, id_contenido: 5, fecha_agregado: '2024-05-05' },
]

// ==================== KPIs DASHBOARD ====================
export const mockKPIs = {
  usuarios_activos: 15420,
  ingresos_mes: 523450000,
  reproducciones_totales: 892340,
  crecimiento_usuarios: 12.5,
  tasa_conversion: 8.3,
  contenido_mas_popular: mockContenido.slice(0, 5),
}

// ==================== DATOS ANALÍTICOS ====================
export const mockConsumoPorCiudad = [
  { ciudad: 'Armenia', plan_basico: 1200, plan_estandar: 2300, plan_premium: 890, total: 4390 },
  { ciudad: 'Pereira', plan_basico: 980, plan_estandar: 1890, plan_premium: 720, total: 3590 },
  { ciudad: 'Manizales', plan_basico: 850, plan_estandar: 1650, plan_premium: 610, total: 3110 },
  { ciudad: 'Bogotá', plan_basico: 3200, plan_estandar: 5400, plan_premium: 2100, total: 10700 },
  { ciudad: 'Medellín', plan_basico: 2800, plan_estandar: 4200, plan_premium: 1800, total: 8800 },
  { ciudad: 'Cali', plan_basico: 2100, plan_estandar: 3500, plan_premium: 1400, total: 7000 },
]

export const mockReproduccionesPorDispositivo = [
  { categoria: 'película', web: 45000, mobile: 32000, tv: 28000, tablet: 12000 },
  { categoria: 'serie', web: 52000, mobile: 48000, tv: 35000, tablet: 18000 },
  { categoria: 'documental', web: 18000, mobile: 12000, tv: 15000, tablet: 5000 },
  { categoria: 'música', web: 8000, mobile: 22000, tv: 3000, tablet: 7000 },
  { categoria: 'podcast', web: 12000, mobile: 28000, tv: 2000, tablet: 8000 },
]

export const mockReporteFinanciero = [
  { ciudad: 'Armenia', plan: 'Básico', ingresos: 21480000, usuarios: 1200, mes: '2024-05' },
  { ciudad: 'Armenia', plan: 'Estándar', ingresos: 77970000, usuarios: 2300, mes: '2024-05' },
  { ciudad: 'Armenia', plan: 'Premium', ingresos: 44411000, usuarios: 890, mes: '2024-05' },
  { ciudad: 'Pereira', plan: 'Básico', ingresos: 17542000, usuarios: 980, mes: '2024-05' },
  { ciudad: 'Pereira', plan: 'Estándar', ingresos: 64071000, usuarios: 1890, mes: '2024-05' },
  { ciudad: 'Pereira', plan: 'Premium', ingresos: 35928000, usuarios: 720, mes: '2024-05' },
]

// ==================== HERRAMIENTAS DBA ====================
export const mockTransacciones = [
  { id: 'TXN-001', usuario: 'quindioflix_app', tabla: 'REPRODUCCIONES', tipo_bloqueo: 'ROW EXCLUSIVE', inicio: '2024-05-12T10:30:00', estado: 'ACTIVE' },
  { id: 'TXN-002', usuario: 'quindioflix_app', tabla: 'USUARIOS', tipo_bloqueo: 'SHARE', inicio: '2024-05-12T10:32:00', estado: 'ACTIVE' },
]

export const mockVistasMaterializadas = [
  { nombre: 'MV_CONSUMO_MENSUAL', ultima_actualizacion: '2024-05-12T00:00:00', estado: 'válida', modo_refresh: 'automático', filas: 45230 },
  { nombre: 'MV_INGRESOS_CIUDAD', ultima_actualizacion: '2024-05-12T00:00:00', estado: 'válida', modo_refresh: 'manual', filas: 12500 },
]

export const mockTablespaces = [
  { nombre: 'TS_REPRODUCCIONES_2024', tamaño_mb: 10240, usado_mb: 7680, libre_mb: 2560, porcentaje_usado: 75 },
  { nombre: 'TS_REPRODUCCIONES_2025', tamaño_mb: 10240, usado_mb: 1024, libre_mb: 9216, porcentaje_usado: 10 },
  { nombre: 'TS_USUARIOS', tamaño_mb: 5120, usado_mb: 2048, libre_mb: 3072, porcentaje_usado: 40 },
  { nombre: 'TS_CONTENIDO', tamaño_mb: 2048, usado_mb: 1536, libre_mb: 512, porcentaje_usado: 75 },
]
