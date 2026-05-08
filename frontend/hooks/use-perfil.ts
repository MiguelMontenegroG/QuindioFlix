'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CLASIFICACIONES_INFANTILES } from '@/lib/validations'
import type { Perfil, Contenido } from '@/lib/types'

interface UsePerfilReturn {
  perfilActivo: Perfil | null
  esInfantil: boolean
  cambiarPerfil: (perfil: Perfil) => void
  limpiarPerfil: () => void
  filtrarPorClasificacion: (contenido: Contenido[]) => Contenido[]
  puedeVerContenido: (contenido: Contenido) => boolean
}

export function usePerfil(): UsePerfilReturn {
  const [perfilActivo, setPerfilActivoState] = useState<Perfil | null>(null)
  const router = useRouter()

  // Cargar perfil activo desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem('perfilActivo')
    if (stored) {
      try {
        setPerfilActivoState(JSON.parse(stored))
      } catch {
        localStorage.removeItem('perfilActivo')
      }
    }
  }, [])

  const esInfantil = perfilActivo?.es_infantil ?? false

  const cambiarPerfil = useCallback((perfil: Perfil) => {
    setPerfilActivoState(perfil)
    localStorage.setItem('perfilActivo', JSON.stringify(perfil))
    router.push('/inicio')
  }, [router])

  const limpiarPerfil = useCallback(() => {
    setPerfilActivoState(null)
    localStorage.removeItem('perfilActivo')
    router.push('/perfiles')
  }, [router])

  /**
   * Filtra contenido según la clasificación de edad del perfil.
   * Si el perfil es infantil, solo muestra contenido TP, +7 y +13.
   */
  const filtrarPorClasificacion = useCallback((contenido: Contenido[]): Contenido[] => {
    if (!esInfantil) return contenido
    return contenido.filter((c) =>
      CLASIFICACIONES_INFANTILES.includes(c.clasificacion_edad as any)
    )
  }, [esInfantil])

  /**
   * Verifica si el perfil puede ver un contenido específico.
   */
  const puedeVerContenido = useCallback((contenido: Contenido): boolean => {
    if (!esInfantil) return true
    return CLASIFICACIONES_INFANTILES.includes(contenido.clasificacion_edad as any)
  }, [esInfantil])

  return {
    perfilActivo,
    esInfantil,
    cambiarPerfil,
    limpiarPerfil,
    filtrarPorClasificacion,
    puedeVerContenido,
  }
}
