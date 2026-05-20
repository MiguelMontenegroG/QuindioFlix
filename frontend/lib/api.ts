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

// ==================== AUTENTICACIÓN ====================
export const authAPI = {
  login: (email: string, password: string) =>
    fetchAPI<{ token: string; usuario: Usuario; perfiles: Perfil[] }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  registro: (data: {
    nombre: string
    email: string
    password: string
    telefono?: string
    ciudad?: string
    fecha_nacimiento?: string
    id_plan: number
    codigo_referido?: string
  }) =>
    fetchAPI<{ usuario: Usuario; mensaje: string }>('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verificarToken: () =>
    fetchAPI<{ usuario: Usuario; perfiles: Perfil[] }>('/auth/verificar'),
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

// ==================== CONTENIDO ====================
export const contenidoAPI = {
  obtenerTodos: (params?: {
    categoria?: string
    genero?: string
    año?: number
    clasificacion?: string
    busqueda?: string
    pagina?: number
    por_pagina?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.categoria !== undefined) searchParams.append('categoria', String(params.categoria))
    if (params?.genero !== undefined) searchParams.append('genero', String(params.genero))
    if (params?.año !== undefined) searchParams.append('anio', String(params.año))
    if (params?.clasificacion !== undefined) searchParams.append('clasificacion', String(params.clasificacion))
    if (params?.busqueda) searchParams.append('q', String(params.busqueda))
    if (params?.pagina !== undefined) searchParams.append('pagina', String(params.pagina))
    if (params?.por_pagina !== undefined) searchParams.append('por_pagina', String(params.por_pagina))
    return fetchAPI<{ data: Contenido[]; total: number }>(`/contenido?${searchParams}`)
  },

  obtenerPorId: (id: number) =>
    fetchAPI<Contenido>(`/contenido/${id}`),

  obtenerRecomendado: (idPerfil: number) =>
    fetchAPI<Contenido | null>(`/contenido/recomendado/${idPerfil}`),

  obtenerPorCategoria: async (categoria: string) => {
    const result = await contenidoAPI.obtenerTodos({ categoria })
    return result.data
  },

  obtenerPorGenero: async (generoId: number) => {
    const result = await contenidoAPI.obtenerTodos({ genero: String(generoId) })
    return result.data
  },

  buscar: async (query: string) => {
    const result = await fetchAPI<{ data: Contenido[]; total: number }>(
      `/contenido/buscar/all?q=${encodeURIComponent(query)}`
    )
    return result.data
  },

  // CRUD para empleados de contenido
  crear: (data: Omit<Contenido, 'id'>) =>
    fetchAPI<Contenido>('/contenido', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: Partial<Contenido>) =>
    fetchAPI<Contenido>(`/contenido/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    fetchAPI<{ mensaje: string }>(`/contenido/${id}`, {
      method: 'DELETE',
    }),
}

// ==================== GÉNEROS ====================
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

// ==================== FAVORITOS ====================
export const favoritosAPI = {
  obtenerPorPerfil: (idPerfil: number) =>
    fetchAPI<Favorito[]>(`/perfiles/${idPerfil}/favoritos`),

  agregar: (idPerfil: number, idContenido: number) =>
    fetchAPI<Favorito>('/favoritos', {
      method: 'POST',
      body: JSON.stringify({ id_perfil: idPerfil, id_contenido: idContenido }),
    }),

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
    id: r.id_reporte ?? r.id,
    id_perfil: r.id_perfil_reportador ?? r.id_perfil,
    id_contenido: r.id_contenido,
    motivo: r.motivo,
    descripcion: r.descripcion,
    estado: normalizeReporteEstado(r.estado_reporte ?? r.estado),
    fecha_creacion: r.fecha_reporte ?? r.fecha_creacion,
    fecha_resolucion: r.fecha_resolucion,
    id_moderador: r.id_moderador,
    comentario_moderador: r.comentario_moderador,
  }
}

export const reportesContenidoAPI = {
  crear: async (data: { id_perfil: number; id_contenido: number; motivo: string }) => {
    const payload = {
      id_perfil_reportador: data.id_perfil,
      id_contenido: data.id_contenido,
      motivo: data.motivo,
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
      estado: data.estado.toUpperCase(),
      comentario_moderador: data.comentario,
    }
    const result = await fetchAPI<any>(`/reportes/${id}/resolver`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    return mapBackendReporteToFrontend(result)
  },
}

// ==================== USUARIOS ====================
export const usuariosAPI = {
  obtenerPorId: (id: number) =>
    fetchAPI<Usuario>(`/usuarios/${id}`),

  actualizar: (id: number, data: Partial<Usuario>) =>
    fetchAPI<Usuario>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Para soporte/admin
  obtenerTodos: (params?: { plan?: number; ciudad?: string; estado?: string; pagina?: number }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value))
      })
    }
    return fetchAPI<{ data: Usuario[]; total: number }>(`/usuarios/lista?${searchParams}`)
  },
}

// ==================== PLANES ====================
export const planesAPI = {
  obtenerTodos: () => fetchAPI<Plan[]>('/pagos/planes'),

  obtenerPorId: (id: number) => fetchAPI<Plan>(`/pagos/planes/${id}`),

  cambiarPlan: (idUsuario: number, idPlanNuevo: number) =>
    fetchAPI<{ mensaje: string; usuario: Usuario }>(`/usuarios/${idUsuario}/plan`, {
      method: 'POST',
      body: JSON.stringify({ id_usuario: idUsuario, id_plan: idPlanNuevo, metodo_pago: 'PSE' }),
    }),

  // Para admin
  actualizar: (id: number, data: Partial<Plan>) =>
    fetchAPI<Plan>(`/admin/planes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

// ==================== PAGOS ====================
export const pagosAPI = {
  obtenerPorUsuario: (idUsuario: number) =>
    fetchAPI<Pago[]>(`/pagos/usuarios/${idUsuario}`),

  // Para soporte
  obtenerTodos: (params?: { estado?: string; pagina?: number }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value))
      })
    }
    return fetchAPI<{ data: Pago[]; total: number }>(`/pagos?${searchParams}`)
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

// ==================== REPORTES ANALÍTICOS ====================
export const analiticaAPI = {
  obtenerKPIs: async () => {
    const data = await fetchAPI<any>('/reportes/kpis')
    return {
      usuarios_activos: data.usuarios_activos,
      ingresos_mensuales: data.ingresos_mes ?? data.ingresos_mensuales,
      total_reproducciones: data.reproducciones_totales ?? data.total_reproducciones,
      contenido_total: data.contenido_total ?? data.contenido_mas_popular?.length,
      contenido_mas_popular: data.contenido_mas_popular,
    } as KPIsDashboard
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
    departamento: row.nombre_depto ?? row.DEPARTAMENTO ?? row.departamento,
    supervisor: row.supervisor ?? row.NOMBRE_SUPERVISOR,
  }
}

export const departamentosAPI = {
  obtenerTodos: () => fetchAPI<any[]>('/admin/departamentos'),
}

