import type {
  Contenido,
  Perfil,
  Plan,
  Usuario,
  Genero,
  Temporada,
  Pago,
  Reporte,
  Reproduccion,
  Favorito,
  Empleado,
  Referido,
  KPIsDashboard,
} from './types'

// Base URL para la API de FastAPI
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Helper para peticiones
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    // FastAPI devuelve "detail", otros backends "message"
    const mensaje = errorBody.detail || errorBody.message || errorBody.error || `Error ${response.status}`
    throw new Error(mensaje)
  }

  return response.json()
}

// ==================== AUTENTICACIÃ“N ====================
export const authAPI = {
  login: async (email: string, password: string) => {
    const data = await fetchAPI<{ token: string; usuario: any; perfiles: any[] }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return {
      token: data.token,
      usuario: mapBackendUsuarioToFrontend(data.usuario),
      perfiles: data.perfiles.map(mapBackendPerfilToFrontend),
    }
  },

  registro: async (data: {
    nombre: string
    email: string
    password: string
    telefono?: string
    ciudad?: string
    fecha_nacimiento?: string
    id_plan: number
    codigo_referido?: string
  }) => {
    const result = await fetchAPI<{ usuario: any; mensaje: string }>('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return { usuario: mapBackendUsuarioToFrontend(result.usuario), mensaje: result.mensaje }
  },

  verificarToken: async () => {
    const data = await fetchAPI<{ usuario: any; perfiles: any[] }>('/auth/verificar')
    return {
      usuario: mapBackendUsuarioToFrontend(data.usuario),
      perfiles: data.perfiles.map(mapBackendPerfilToFrontend),
    }
  },
}

// ==================== PERFILES ====================

// Funciones de mapeo entre backend (id_perfil, nombre_perfil, tipo=ADULTO|INFANTIL)
// y frontend (id, nombre, es_infantil)
function mapBackendPerfilToFrontend(bp: any): Perfil {
  return {
    id: bp.id_perfil ?? bp.id,
    id_usuario: bp.id_usuario,
    nombre: bp.nombre_perfil ?? bp.nombre,
    avatar: bp.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(bp.nombre_perfil || bp.nombre || 'U')}`,
    es_infantil: bp.tipo === 'INFANTIL',
    pin: bp.pin,
  }
}

function mapFrontendPerfilToBackend(p: { nombre: string; es_infantil: boolean; avatar?: string }) {
  return {
    nombre_perfil: p.nombre,
    avatar: p.avatar || 'default.png',
    tipo: p.es_infantil ? 'INFANTIL' : 'ADULTO',
  }
}

export const perfilesAPI = {
  obtenerPorUsuario: async (idUsuario: number) => {
    const data = await fetchAPI<any[]>(`/usuarios/${idUsuario}/perfiles`)
    return data.map(mapBackendPerfilToFrontend)
  },

  crear: async (data: { id_usuario: number; nombre: string; es_infantil: boolean; avatar?: string }) => {
    const backendData = mapFrontendPerfilToBackend(data)
    const result = await fetchAPI<any>(`/usuarios/${data.id_usuario}/perfiles`, {
      method: 'POST',
      body: JSON.stringify(backendData),
    })
    return mapBackendPerfilToFrontend(result)
  },

  actualizar: async (id: number, data: { nombre?: string; es_infantil?: boolean; avatar?: string }) => {
    const backendData: any = {}
    if (data.nombre !== undefined) backendData.nombre_perfil = data.nombre
    if (data.avatar !== undefined) backendData.avatar = data.avatar
    if (data.es_infantil !== undefined) backendData.tipo = data.es_infantil ? 'INFANTIL' : 'ADULTO'
    const result = await fetchAPI<any>(`/perfiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendData),
    })
    return mapBackendPerfilToFrontend(result)
  },

  eliminar: (id: number) =>
    fetchAPI<{ mensaje: string }>(`/perfiles/${id}`, {
      method: 'DELETE',
    }),
}

// Mapeo de categorias: backend usa numeros (id_categoria), frontend usa strings
const CATEGORIA_MAP: Record<number, string> = {
  1: 'Pelicula',
  2: 'Serie',
  3: 'Documental',
  4: 'Musica',
  5: 'Podcast',
}

// Mapa inverso: nombre categoria -> id numerico
const CATEGORIA_NAME_TO_ID: Record<string, number> = {
  'pelicula': 1,
  'serie': 2,
  'documental': 3,
  'musica': 4,
  'podcast': 5,
  'película': 1,
  'música': 4,
}

/** Extrae un string seguro de un campo que puede ser string, nÃºmero u objeto con {nombre_categoria, nombre} */
function safeString(val: any): string {
  if (typeof val === 'string') return val
  if (typeof val === 'number') return String(val)
  if (val && typeof val === 'object') {
    if (val.nombre_categoria) return val.nombre_categoria
    if (val.nombre) return val.nombre
  }
  return ''
}

function obtenerNombreCategoria(id?: number, nombre?: any): string {
  // Si nombre es un objeto (ej: {nombre_categoria, descripcion, id_categoria}), extraer nombre_categoria
  const nombreStr = safeString(nombre)
  if (nombreStr) return nombreStr
  if (id && CATEGORIA_MAP[id]) return CATEGORIA_MAP[id]
  return 'Pelicula'
}

// Mapeo backend -> frontend para Contenido
function mapBackendContenidoToFrontend(bc: any): Contenido {
  // Si bc.categoria o bc.nombre_categoria es un objeto, extraer el nombre
  const categoriaRaw = bc.nombre_categoria ?? bc.categoria
  const categoria = obtenerNombreCategoria(bc.id_categoria, categoriaRaw)
  // Depuracion: ver que valor tiene poster_url
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] mapBackendContenidoToFrontend:', bc.titulo, '| poster_url:', bc.poster_url, '| existe poster_url?', bc.poster_url ? 'SI' : 'NO');
  }
  return {
    id: bc.id_contenido ?? bc.id,
    titulo: bc.titulo ?? bc.TITULO,
    sinopsis: bc.sinopsis ?? bc.SINOPSIS ?? '',
    año: bc.anio_lanzamiento ?? bc.año ?? bc.ANIO_LANZAMIENTO,
    duracion_minutos: bc.duracion ? Math.round(bc.duracion / 60) : (bc.duracion_minutos || 0),
    clasificacion_edad: safeString(bc.clasificacion_edad ?? bc.CLASIFICACION_EDAD) as any,
    categoria: categoria as any,
    generos: Array.isArray(bc.generos) ? bc.generos.map((g: any) => ({
      id: g.id_genero ?? g.id,
      nombre: g.nombre_genero ?? g.nombre,
    })) : [],
    poster_url: bc.poster_url || bc.POSTER_URL || `https://placehold.co/300x450?text=${encodeURIComponent(String(bc.titulo || '').slice(0, 20) || '?')}`,
    banner_url: bc.banner_url,
    trailer_url: bc.trailer_url,
    es_original: bc.es_original === 'S' || bc.es_original === true,
    estado: (bc.estado || 'publicado').toLowerCase() as any,
    calificacion_promedio: bc.calificacion_promedio ?? bc.CALIFICACION_PROMEDIO,
    total_reproducciones: bc.total_reproducciones ?? bc.TOTAL_REPRODUCCIONES,
    fecha_publicacion: bc.fecha_agregado ?? bc.fecha_publicacion,
  }
}

// Mapeo frontend -> backend para Contenido (CRUD)
function mapFrontendContenidoToBackend(fc: any): any {
  const backend: any = {
    titulo: fc.titulo,
    anio_lanzamiento: fc.año,
    duracion: (fc.duracion_minutos || 0) * 60,
    sinopsis: fc.sinopsis,
    clasificacion_edad: fc.clasificacion_edad,
    es_original: fc.es_original ? 'S' : 'N',
    id_categoria: Object.entries(CATEGORIA_MAP).find(([, v]) => v === fc.categoria)?.[0] || 1,
    generos: fc.generos?.map((g: any) => g.id ?? g) || [],
  }
  // Solo incluir campos opcionales si fueron proporcionados explicitamente
  if (fc.id_empleado_resp !== undefined) {
    backend.id_empleado_resp = fc.id_empleado_resp
  }
  if (fc.poster_url) {
    backend.poster_url = fc.poster_url
  }
  if (fc.banner_url) {
    backend.banner_url = fc.banner_url
  }
  return backend
}

// ==================== CONTENIDO ====================
export const contenidoAPI = {
  obtenerTodos: (params?: {
    categoria?: string | number
    genero?: string
    año?: number
    clasificacion?: string
    busqueda?: string
    pagina?: number
    por_pagina?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.categoria !== undefined) {
      // Convertir nombre de categoria a ID numerico si es necesario
      const catValue = params.categoria
      if (typeof catValue === 'string' && isNaN(Number(catValue))) {
        const catId = CATEGORIA_NAME_TO_ID[catValue.toLowerCase()]
        if (catId !== undefined) {
          searchParams.append('categoria', String(catId))
        }
      } else {
        searchParams.append('categoria', String(catValue))
      }
    }
    if (params?.genero !== undefined) searchParams.append('genero', String(params.genero))
    if (params?.año !== undefined) searchParams.append('anio', String(params.año))
    if (params?.clasificacion !== undefined) searchParams.append('clasificacion', String(params.clasificacion))
    if (params?.busqueda) searchParams.append('q', String(params.busqueda))
    if (params?.pagina !== undefined) searchParams.append('pagina', String(params.pagina))
    if (params?.por_pagina !== undefined) searchParams.append('por_pagina', String(params.por_pagina))
    return fetchAPI<{ data: any[]; total: number }>(`/contenido?${searchParams}`).then(resp => ({
      ...resp,
      data: resp.data.map(mapBackendContenidoToFrontend),
    }))
  },

  obtenerPorId: async (id: number) => {
    const data = await fetchAPI<any>(`/contenido/${id}`)
    return mapBackendContenidoToFrontend(data)
  },

  obtenerRecomendado: async (idPerfil: number) => {
    const data = await fetchAPI<any | null>(`/contenido/recomendado/${idPerfil}`)
    return data ? mapBackendContenidoToFrontend(data) : null
  },

  obtenerPorCategoria: async (categoria: string) => {
    const result = await contenidoAPI.obtenerTodos({ categoria })
    return result.data
  },

  obtenerPorGenero: async (generoId: number) => {
    const result = await contenidoAPI.obtenerTodos({ genero: String(generoId) })
    return result.data
  },

  buscar: async (query: string) => {
    const result = await fetchAPI<{ data: any[]; total: number }>(
      `/contenido/buscar/all?q=${encodeURIComponent(query)}`
    )
    return result.data.map(mapBackendContenidoToFrontend)
  },

  // CRUD para empleados de contenido
  crear: async (data: Omit<Contenido, 'id'>) => {
    const backendData = mapFrontendContenidoToBackend(data)
    const result = await fetchAPI<any>('/contenido', {
      method: 'POST',
      body: JSON.stringify(backendData),
    })
    return mapBackendContenidoToFrontend(result)
  },

  actualizar: async (id: number, data: Partial<Contenido>) => {
    const backendData = mapFrontendContenidoToBackend(data)
    const result = await fetchAPI<any>(`/contenido/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendData),
    })
    return mapBackendContenidoToFrontend(result)
  },

  eliminar: (id: number) =>
    fetchAPI<{ mensaje: string }>(`/contenido/${id}`, {
      method: 'DELETE',
    }),
}

// ==================== GÃ‰NEROS ====================
export const generosAPI = {
  obtenerTodos: () => fetchAPI<Genero[]>('/contenido/generos/all'),
}

// ==================== TEMPORADAS Y EPISODIOS ====================
export const temporadasAPI = {
  obtenerPorContenido: (idContenido: number) =>
    fetchAPI<Temporada[]>(`/contenido/${idContenido}/temporadas`),
}

// ==================== REPRODUCCIONES ====================
export const reproduccionesAPI = {
  registrar: (data: {
    id_perfil: number
    id_contenido: number
    id_episodio?: number
    dispositivo: string
  }) =>
    fetchAPI<Reproduccion>('/reproducciones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: { porcentaje_avance: number; fecha_fin?: string }) =>
    fetchAPI<Reproduccion>(`/reproducciones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  obtenerHistorial: (idPerfil: number) =>
    fetchAPI<Reproduccion[]>(`/perfiles/${idPerfil}/historial`),

  obtenerEnProgreso: (idPerfil: number) =>
    fetchAPI<Reproduccion[]>(`/perfiles/${idPerfil}/historial/en-progreso`),
}

function mapBackendFavoritoToFrontend(bf: any): Favorito {
  return {
    id: bf.id ?? `${bf.id_perfil}-${bf.id_contenido}`,
    id_perfil: bf.id_perfil,
    id_contenido: bf.id_contenido,
    fecha_agregado: bf.fecha_agregado,
    contenido: bf.contenido ? mapBackendContenidoToFrontend(bf.contenido) : undefined,
  }
}

// ==================== FAVORITOS ====================
export const favoritosAPI = {
  obtenerPorPerfil: async (idPerfil: number) => {
    const data = await fetchAPI<any[]>(`/perfiles/${idPerfil}/favoritos`)
    return data.map(mapBackendFavoritoToFrontend)
  },

  agregar: async (idPerfil: number, idContenido: number) => {
    const result = await fetchAPI<any>('/favoritos', {
      method: 'POST',
      body: JSON.stringify({ id_perfil: idPerfil, id_contenido: idContenido }),
    })
    return mapBackendFavoritoToFrontend(result)
  },

  eliminar: (idPerfil: number, idContenido: number) =>
    fetchAPI<{ mensaje: string }>(`/favoritos/${idPerfil}/${idContenido}`, {
      method: 'DELETE',
    }),
}

// ==================== CALIFICACIONES ====================
export const calificacionesAPI = {
  crear: (data: { id_perfil: number; id_contenido: number; estrellas: number; resenia?: string }) =>
    fetchAPI('/calificaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  obtenerPorContenido: (idContenido: number) =>
    fetchAPI(`/contenido/${idContenido}/calificaciones`),
}

// ==================== REPORTES DE CONTENIDO ====================
function normalizeReporteEstado(value?: string) {
  const raw = (value || '').toString().toLowerCase()
  if (raw === 'en_revision') return 'pendiente'
  if (raw === 'pendiente' || raw === 'resuelto' || raw === 'rechazado') return raw
  return 'pendiente'
}

function mapBackendReporteToFrontend(r: any): Reporte {
  return {
    id: r.ID_REPORTE ?? r.id_reporte ?? r.id,
    id_perfil: r.ID_PERFIL_REPORTADOR ?? r.id_perfil_reportador ?? r.id_perfil,
    id_contenido: r.ID_CONTENIDO ?? r.id_contenido,
    motivo: r.MOTIVO ?? r.motivo,
    descripcion: r.DESCRIPCION ?? r.descripcion,
    estado: normalizeReporteEstado(r.ESTADO_REPORTE ?? r.estado_reporte ?? r.estado),
    fecha_creacion: r.FECHA_REPORTE ?? r.fecha_reporte ?? r.fecha_creacion,
    fecha_resolucion: r.FECHA_RESOLUCION ?? r.fecha_resolucion,
    id_moderador: r.ID_MODERADOR ?? r.id_moderador,
    nombre_reportador: r.NOMBRE_REPORTADOR ?? r.nombre_reportador,
    titulo_contenido: r.TITULO_CONTENIDO ?? r.titulo_contenido,
    comentario_moderador: r.COMENTARIO_MODERADOR ?? r.comentario_moderador,
  }
}
export const reportesContenidoAPI = {
  crear: async (data: { id_perfil: number; id_contenido: number; motivo: string; descripcion?: string }) => {
    const payload: any = {
      id_perfil_reportador: data.id_perfil,
      id_contenido: data.id_contenido,
      motivo: data.motivo,
    }
    if (data.descripcion) {
      payload.descripcion = data.descripcion
    }
    const result = await fetchAPI<any>('/reportes', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return mapBackendReporteToFrontend(result)
  },

  // Para moderadores
  obtenerPendientes: async () => {
    const result = await fetchAPI<{ data: any[]; total: number }>(`/reportes?estado=PENDIENTE`)
    return result.data.map(mapBackendReporteToFrontend)
  },

  obtenerTodos: async (params?: { estado?: string; pagina?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.estado) searchParams.append('estado', params.estado.toUpperCase())
    if (params?.pagina !== undefined) searchParams.append('pagina', String(params.pagina))
    const result = await fetchAPI<{ data: any[]; total: number }>(`/reportes?${searchParams}`)
    return { ...result, data: result.data.map(mapBackendReporteToFrontend) }
  },

  resolver: async (id: number, data: { estado: 'resuelto' | 'rechazado'; comentario: string }) => {
    const payload = {
      estado: data.estado === 'resuelto' ? 'RESUELTO' : 'RECHAZADO',
      comentario_moderador: data.comentario,
    }
    const result = await fetchAPI<any>(`/reportes/${id}/resolver`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    return mapBackendReporteToFrontend(result)
  },
}

function mapBackendUsuarioToFrontend(bu: any): Usuario {
  return {
    id: bu.id_usuario ?? bu.id,
    nombre: bu.nombre,
    email: bu.email,
    telefono: bu.telefono,
    ciudad: bu.ciudad,
    fecha_nacimiento: bu.fecha_nacimiento,
    id_plan: bu.id_plan,
    estado: (bu.estado_cuenta ?? bu.estado ?? 'ACTIVO').toLowerCase() as any,
    codigo_referido: bu.codigo_referido ?? bu.id_referidor,
    fecha_registro: bu.fecha_registro,
    es_admin: bu.es_admin ?? false,
    role: bu.role ?? 'usuario',
    plan: bu.plan,
  }
}

// ==================== USUARIOS ====================
export const usuariosAPI = {
  obtenerPorId: async (id: number) => {
    const data = await fetchAPI<any>(`/usuarios/${id}`)
    return mapBackendUsuarioToFrontend(data)
  },

  actualizar: async (id: number, data: Partial<Usuario>) => {
    const result = await fetchAPI<any>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return mapBackendUsuarioToFrontend(result)
  },

  // Para soporte/admin
  obtenerTodos: async (params?: { plan?: number; ciudad?: string; estado?: string; pagina?: number }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value))
      })
    }
    const result = await fetchAPI<{ data: any[]; total: number }>(`/usuarios/lista?${searchParams}`)
    return { ...result, data: result.data.map(mapBackendUsuarioToFrontend) }
  },
}

function mapBackendPlanToFrontend(bp: any): Plan {
  return {
    id: bp.id_plan ?? bp.id,
    nombre: (bp.nombre_plan ?? bp.nombre) as any,
    precio: bp.precio_mensual ?? bp.precio,
    max_pantallas: bp.num_pantallas ?? bp.max_pantallas,
    calidad: (bp.calidad_video ?? bp.calidad) as any,
    max_perfiles: bp.max_perfiles,
    descripcion: bp.descripcion,
  }
}

function mapFrontendPlanToBackend(fp: any): any {
  return {
    nombre_plan: fp.nombre,
    precio_mensual: fp.precio,
    num_pantallas: fp.max_pantallas,
    calidad_video: fp.calidad,
    max_perfiles: fp.max_perfiles,
  }
}

// ==================== PLANES ====================
export const planesAPI = {
  obtenerTodos: async () => {
    const data = await fetchAPI<any[]>('/pagos/planes')
    return data.map(mapBackendPlanToFrontend)
  },

  obtenerPorId: async (id: number) => {
    const data = await fetchAPI<any>(`/pagos/planes/${id}`)
    return mapBackendPlanToFrontend(data)
  },

  cambiarPlan: (idUsuario: number, idPlanNuevo: number) =>
    fetchAPI<{ mensaje: string; usuario: Usuario }>(`/usuarios/${idUsuario}/plan`, {
      method: 'POST',
      body: JSON.stringify({ id_usuario: idUsuario, id_plan: idPlanNuevo, metodo_pago: 'PSE' }),
    }),

  // Para admin
  actualizar: (id: number, data: Partial<Plan>) =>
    fetchAPI<Plan>(`/admin/planes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapFrontendPlanToBackend(data)),
    }),
}

// ==================== PAGOS ====================
function mapBackendPagoToFrontend(bp: any): Pago {
  return {
    id: bp.ID_PAGO ?? bp.id_pago ?? bp.id,
    id_usuario: bp.ID_USUARIO ?? bp.id_usuario,
    monto: bp.MONTO ?? bp.monto,
    fecha_pago: bp.FECHA_PAGO ?? bp.fecha_pago,
    metodo_pago: bp.METODO_PAGO ?? bp.metodo_pago,
    estado_pago: bp.ESTADO_PAGO ?? bp.estado_pago,
    fecha_vencimiento: bp.FECHA_VENCIMIENTO ?? bp.fecha_vencimiento,
  }
}

export const pagosAPI = {
  obtenerPorUsuario: (idUsuario: number) =>
    fetchAPI<any[]>(`/pagos/usuarios/${idUsuario}`).then(data => data.map(mapBackendPagoToFrontend)),

  crear: (data: { id_usuario: number; monto: number; metodo_pago: string; fecha_vencimiento: string; estado_pago?: string }) =>
    fetchAPI<any>('/pagos', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(mapBackendPagoToFrontend),

  calcularMonto: (idUsuario: number) =>
    fetchAPI<{ id_usuario: number; monto: number }>(`/pagos/calcular-monto/${idUsuario}`),

  // Para soporte
  obtenerTodos: async (params?: { estado?: string; pagina?: number }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value))
      })
    }
    const result = await fetchAPI<{ data: any[]; total: number }>(`/pagos?${searchParams}`)
    return { ...result, data: result.data.map(mapBackendPagoToFrontend) }
  },

  actualizarEstado: (id: number, estado: string) =>
    fetchAPI<{ mensaje: string }>(`/pagos/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    }),
}

// ==================== REFERIDOS ====================
export const referidosAPI = {
  obtenerPorUsuario: (idUsuario: number) =>
    fetchAPI<Referido[]>(`/usuarios/${idUsuario}/referidos`),

  obtenerDescuentos: (idUsuario: number) =>
    fetchAPI<{ total_descuentos: number; referidos_activos: number }>(`/usuarios/${idUsuario}/referidos/descuentos`),
}

// ==================== EMPLEADOS ====================
export const empleadosAPI = {
  obtenerTodos: async (params?: { departamento?: string; pagina?: number }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value))
      })
    }
    const result = await fetchAPI<{ data: any[]; total: number }>(`/admin/empleados?${searchParams}`)
    return { ...result, data: result.data.map(mapBackendEmpleadoToFrontend) }
  },

  obtenerPorId: async (id: number) => {
    const result = await fetchAPI<any>(`/admin/empleados/${id}`)
    return mapBackendEmpleadoToFrontend(result)
  },

  crear: (data: {
    nombre: string
    email: string
    cargo: string
    fecha_contratacion: string
    id_departamento: number
    id_supervisor?: number | null
  }) =>
    fetchAPI<{ mensaje: string }>('/admin/empleados', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: Partial<{
    nombre: string
    email: string
    cargo: string
    id_departamento: number
    id_supervisor?: number | null
  }>) =>
    fetchAPI<{ mensaje: string }>(`/admin/empleados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    fetchAPI<{ mensaje: string }>(`/admin/empleados/${id}`, {
      method: 'DELETE',
    }),
}

// ==================== REPORTES ANALÃTICOS ====================
export const analiticaAPI = {
  obtenerKPIs: async () => {
    const data = await fetchAPI<any>('/reportes/kpis')
    let reportesPendientes = 0
    try {
      const modData = await fetchAPI<any>('/reportes/moderacion')
      reportesPendientes = modData?.pendientes ?? 0
    } catch {
      // No hay permisos de moderacion, ignorar
    }
    return {
      usuarios_activos: data.usuarios_activos ?? 0,
      ingresos_mensuales: data.ingresos_mes ?? data.ingresos_mensuales ?? 0,
      ingresos_mes: data.ingresos_mes ?? data.ingresos_mensuales ?? 0,
      total_reproducciones: data.reproducciones_totales ?? data.total_reproducciones ?? 0,
      contenido_total: data.contenido_total ?? data.contenido_mas_popular?.length ?? 0,
      contenido_mas_popular: data.contenido_mas_popular ?? [],
      reportes_pendientes: reportesPendientes,
    } as any
  },

  consumoPorCiudad: () => fetchAPI('/reportes/consumo-ciudad'),

  reproduccionesPorDispositivo: () => fetchAPI('/reportes/reproducciones-dispositivo'),

  reporteFinanciero: async (params?: { mes?: string; año?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.mes !== undefined) searchParams.append('mes', String(params.mes))
    if (params?.año !== undefined) searchParams.append('anio', String(params.año))
    const result = await fetchAPI<{ data: any[]; total: number }>(`/reportes/financiero?${searchParams}`)
    return result.data.map((row) => ({
      ciudad: row.CIUDAD ?? row.ciudad,
      plan: row.PLAN ?? row.plan,
      mes: row.MES ?? row.mes,
      ingresos: row.INGRESOS ?? row.ingresos,
      usuarios: row.USUARIOS ?? row.usuarios,
    }))
  },

  contenidoPopular: (limite: number = 10) =>
    fetchAPI<any[]>(`/reportes/contenido-popular?limite=${limite}`),

  reporteEquipo: () => fetchAPI('/reportes/equipo'),

  estadisticasModeracion: () => fetchAPI('/reportes/moderacion'),
}

// ==================== HERRAMIENTAS DBA ====================
export const dbaAPI = {
  transaccionesActivas: () => fetchAPI('/dba/transacciones'),

  explainPlan: (query: string) =>
    fetchAPI('/dba/explain-plan', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  vistasMaterializadas: () => fetchAPI('/dba/vistas-materializadas'),

  refrescarVista: (nombre: string) =>
    fetchAPI(`/dba/vistas-materializadas/${nombre}/refrescar`, {
      method: 'POST',
    }),

  tablespaces: () => fetchAPI('/dba/tablespaces'),

  ejecutarRenovacion: () =>
    fetchAPI('/dba/renovacion-mensual', {
      method: 'POST',
    }),

  ejecutarQuery: (query: string, limite: number = 500) =>
    fetchAPI<{ columns: string[]; rows: Record<string, any>[]; total: number; mostrando: number }>(`/dba/query?limite=${limite}`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  // ==================== NUEVOS ENDPOINTS DBA ====================

  /** Detalle de tablespaces de reproducciones (TS_REPROD_2024 y TS_REPROD_2025) */
  tablespacesReproducciones: () =>
    fetchAPI<{ data: any[]; mensaje?: string }>('/dba/tablespaces-detalle'),

  /** Detalle ampliado de vistas materializadas (con metodo_refresh, propietario, etc.) */
  vistasMaterializadasDetalle: () =>
    fetchAPI<any[]>('/dba/vistas-materializadas-detalle'),

  /** Refrescar una vista materializada por nombre desde el body */
  refrescarVistaPorNombre: (nombre: string) =>
    fetchAPI<{ mensaje?: string; error?: string }>('/dba/vistas-materializadas/refresh', {
      method: 'POST',
      body: JSON.stringify({ nombre }),
    }),
}

function mapBackendEmpleadoToFrontend(row: any): Empleado {
  return {
    id: row.id_empleado ?? row.ID_EMPLEADO ?? row.id,
    nombre: row.nombre ?? row.NOMBRE,
    email: row.email ?? row.EMAIL,
    cargo: row.cargo ?? row.CARGO,
    fecha_contratacion: row.fecha_contratacion ?? row.FECHA_CONTRATACION,
    id_departamento: row.id_departamento ?? row.ID_DEPARTAMENTO,
    id_supervisor: row.id_supervisor ?? row.ID_SUPERVISOR,
    departamento: row.nombre_depto ?? row.NOMBRE_DEPTO ?? row.DEPARTAMENTO ?? row.departamento,
    supervisor: row.nombre_supervisor ?? row.NOMBRE_SUPERVISOR ?? row.supervisor,
  }
}

export const departamentosAPI = {
  obtenerTodos: () => fetchAPI<any[]>('/admin/departamentos'),
}