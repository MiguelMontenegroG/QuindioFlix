'use client'

import useSWR from 'swr'
import { contenidoAPI, generosAPI } from '@/lib/api'
import { mockContenido, mockGeneros, mockKPIs } from '@/lib/mock-data'
import type { Contenido, Genero, KPIsDashboard } from '@/lib/types'

// En desarrollo/mock usamos datos simulados
const USE_MOCK = true

// ============================================
// Hook: Obtener todo el catálogo
// ============================================
export function useCatalogo(params?: {
  categoria?: string
  genero?: string
  año?: number
  clasificacion?: string
  busqueda?: string
}) {
  if (USE_MOCK) {
    let filtered = [...mockContenido]

    if (params?.categoria) {
      filtered = filtered.filter((c) => c.categoria === params.categoria)
    }
    if (params?.genero) {
      filtered = filtered.filter((c) =>
        c.generos.some((g) => g.nombre === params.genero)
      )
    }
    if (params?.año) {
      filtered = filtered.filter((c) => c.año === params.año)
    }
    if (params?.clasificacion) {
      filtered = filtered.filter((c) => c.clasificacion_edad === params.clasificacion)
    }
    if (params?.busqueda) {
      const q = params.busqueda.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.titulo.toLowerCase().includes(q) ||
          c.sinopsis.toLowerCase().includes(q)
      )
    }

    return {
      data: { data: filtered, total: filtered.length },
      isLoading: false,
      error: null,
      mutate: () => {},
    }
  }

  return useSWR(
    ['/contenido', params],
    () => contenidoAPI.obtenerTodos(params)
  )
}

// ============================================
// Hook: Obtener contenido por ID
// ============================================
export function useContenido(id: number) {
  if (USE_MOCK) {
    const contenido = mockContenido.find((c) => c.id === id) || null
    return {
      data: contenido,
      isLoading: false,
      error: contenido ? null : new Error('Contenido no encontrado'),
      mutate: () => {},
    }
  }

  return useSWR(
    id ? `/contenido/${id}` : null,
    () => contenidoAPI.obtenerPorId(id)
  )
}

// ============================================
// Hook: Obtener contenido recomendado
// ============================================
export function useContenidoRecomendado(idPerfil: number) {
  if (USE_MOCK) {
    const ordenado = [...mockContenido].sort(
      (a, b) => (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0)
    )
    return {
      data: ordenado.slice(0, 10),
      isLoading: false,
      error: null,
      mutate: () => {},
    }
  }

  return useSWR(
    idPerfil ? `/contenido/recomendado/${idPerfil}` : null,
    () => contenidoAPI.obtenerRecomendado(idPerfil)
  )
}

// ============================================
// Hook: Obtener géneros
// ============================================
export function useGeneros() {
  if (USE_MOCK) {
    return {
      data: mockGeneros,
      isLoading: false,
      error: null,
      mutate: () => {},
    }
  }

  return useSWR('/contenido/generos/all', () => generosAPI.obtenerTodos())
}

// ============================================
// Hook: Búsqueda
// ============================================
export function useBusqueda(query: string) {
  if (USE_MOCK) {
    if (!query) return { data: [], isLoading: false, error: null, mutate: () => {} }
    const q = query.toLowerCase()
    const results = mockContenido.filter(
      (c) =>
        c.titulo.toLowerCase().includes(q) ||
        c.sinopsis.toLowerCase().includes(q)
    )
    return {
      data: results,
      isLoading: false,
      error: null,
      mutate: () => {},
    }
  }

  return useSWR(
    query ? `/contenido/buscar/all?q=${query}` : null,
    () => contenidoAPI.buscar(query)
  )
}

// ============================================
// Hook: KPIs del Dashboard
// ============================================
export function useKPIs() {
  if (USE_MOCK) {
    return {
      data: mockKPIs as KPIsDashboard,
      isLoading: false,
      error: null,
      mutate: () => {},
    }
  }

  return useSWR('/reportes/kpis', () => import('@/lib/api').then((m) => m.analiticaAPI.obtenerKPIs()))
}
