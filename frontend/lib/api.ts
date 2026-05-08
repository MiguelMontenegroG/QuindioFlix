import type {
  Contenido,
  Perfil,
  Plan,
  Usuario,
  Genero,
  Temporada,
  Episodio,
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
    const error = await response.json().catch(() => ({ message: 'Error de conexión' }))
    throw new Error(error.message || `Error ${response.status}`)
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

  recuperarPassword: (email: string) =>
    fetchAPI<{ mensaje: string }>('/auth/recuperar-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verificarToken: () =>
    fetchAPI<{ usuario: Usuario; perfiles: Perfil[] }>('/auth/verificar'),
}

// ==================== PERFILES ====================
export const perfilesAPI = {
  obtenerPorUsuario: (idUsuario: number) =>
    fetchAPI<Perfil[]>(`/usuarios/${idUsuario}/perfiles`),

  crear: (data: { id_usuario: number; nombre: string; es_infantil: boolean; pin?: string }) =>
    fetchAPI<Perfil>('/perfiles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: Partial<Perfil>) =>
    fetchAPI<Perfil>(`/perfiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

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
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value))
      })
    }
    return fetchAPI<{ data: Contenido[]; total: number }>(`/contenido?${searchParams}`)
  },

  obtenerPorId: (id: number) =>
    fetchAPI<Contenido>(`/contenido/${id}`),

  obtenerRecomendado: (idPerfil: number) =>
    fetchAPI<Contenido[]>(`/contenido/recomendado/${idPerfil}`),

  obtenerPorCategoria: (categoria: string) =>
    fetchAPI<Contenido[]>(`/contenido/categoria/${categoria}`),

  obtenerPorGenero: (generoId: number) =>
    fetchAPI<Contenido[]>(`/contenido/genero/${generoId}`),

  buscar: (query: string) =>
    fetchAPI<Contenido[]>(`/contenido/buscar?q=${encodeURIComponent(query)}`),

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
  obtenerTodos: () => fetchAPI<Genero[]>('/generos'),
}

// ==================== TEMPORADAS Y EPISODIOS ====================
export const temporadasAPI = {
  obtenerPorContenido: (idContenido: number) =>
    fetchAPI<Temporada[]>(`/contenido/${idContenido}/temporadas`),

  crear: (data: Omit<Temporada, 'id' | 'episodios'>) =>
    fetchAPI<Temporada>('/temporadas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: Partial<Temporada>) =>
    fetchAPI<Temporada>(`/temporadas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    fetchAPI<{ mensaje: string }>(`/temporadas/${id}`, {
      method: 'DELETE',
    }),
}

export const episodiosAPI = {
  obtenerPorTemporada: (idTemporada: number) =>
    fetchAPI<Episodio[]>(`/temporadas/${idTemporada}/episodios`),

  crear: (data: Omit<Episodio, 'id'>) =>
    fetchAPI<Episodio>('/episodios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: Partial<Episodio>) =>
    fetchAPI<Episodio>(`/episodios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    fetchAPI<{ mensaje: string }>(`/episodios/${id}`, {
      method: 'DELETE',
    }),
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
    fetchAPI<Reproduccion[]>(`/perfiles/${idPerfil}/reproducciones`),

  obtenerEnProgreso: (idPerfil: number) =>
    fetchAPI<Reproduccion[]>(`/perfiles/${idPerfil}/reproducciones/en-progreso`),
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
  crear: (data: { id_perfil: number; id_contenido: number; puntuacion: number; reseña?: string }) =>
    fetchAPI('/calificaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  obtenerPorContenido: (idContenido: number) =>
    fetchAPI(`/contenido/${idContenido}/calificaciones`),
}

// ==================== REPORTES DE CONTENIDO ====================
export const reportesContenidoAPI = {
  crear: (data: { id_perfil: number; id_contenido: number; motivo: string; descripcion?: string }) =>
    fetchAPI<Reporte>('/reportes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Para moderadores
  obtenerPendientes: () =>
    fetchAPI<Reporte[]>('/reportes?estado=pendiente'),

  obtenerTodos: (params?: { estado?: string; pagina?: number }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value))
      })
    }
    return fetchAPI<{ data: Reporte[]; total: number }>(`/reportes?${searchParams}`)
  },

  resolver: (id: number, data: { estado: 'resuelto' | 'rechazado'; comentario: string }) =>
    fetchAPI<Reporte>(`/reportes/${id}/resolver`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
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
    return fetchAPI<{ data: Usuario[]; total: number }>(`/usuarios?${searchParams}`)
  },

  cambiarEstado: (id: number, estado: 'activo' | 'inactivo') =>
    fetchAPI<Usuario>(`/usuarios/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    }),
}

// ==================== PLANES ====================
export const planesAPI = {
  obtenerTodos: () => fetchAPI<Plan[]>('/planes'),

  obtenerPorId: (id: number) => fetchAPI<Plan>(`/planes/${id}`),

  cambiarPlan: (idUsuario: number, idPlanNuevo: number) =>
    fetchAPI<{ mensaje: string; usuario: Usuario }>('/planes/cambiar', {
      method: 'POST',
      body: JSON.stringify({ id_usuario: idUsuario, id_plan: idPlanNuevo }),
    }),

  // Para admin
  actualizar: (id: number, data: Partial<Plan>) =>
    fetchAPI<Plan>(`/planes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

// ==================== PAGOS ====================
export const pagosAPI = {
  obtenerPorUsuario: (idUsuario: number) =>
    fetchAPI<Pago[]>(`/usuarios/${idUsuario}/pagos`),

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
    fetchAPI<Pago>(`/pagos/${id}/estado`, {
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
  obtenerTodos: (params?: { departamento?: string; pagina?: number }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value))
      })
    }
    return fetchAPI<{ data: Empleado[]; total: number }>(`/empleados?${searchParams}`)
  },

  obtenerPorId: (id: number) => fetchAPI<Empleado>(`/empleados/${id}`),

  crear: (data: Omit<Empleado, 'id'>) =>
    fetchAPI<Empleado>('/empleados', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: Partial<Empleado>) =>
    fetchAPI<Empleado>(`/empleados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    fetchAPI<{ mensaje: string }>(`/empleados/${id}`, {
      method: 'DELETE',
    }),
}

// ==================== REPORTES ANALÍTICOS ====================
export const analiticaAPI = {
  obtenerKPIs: () => fetchAPI<KPIsDashboard>('/reportes/kpis'),

  consumoPorCiudad: () => fetchAPI('/reportes/consumo-ciudad'),

  reproduccionesPorDispositivo: () => fetchAPI('/reportes/reproducciones-dispositivo'),

  reporteFinanciero: (params?: { mes?: string; año?: number }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value))
      })
    }
    return fetchAPI(`/reportes/financiero?${searchParams}`)
  },

  contenidoPopular: (params?: { genero?: number; ciudad?: string; limite?: number }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value))
      })
    }
    return fetchAPI<Contenido[]>(`/reportes/contenido-popular?${searchParams}`)
  },

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
