'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { reproduccionesAPI } from '@/lib/api'

interface UseReproduccionOptions {
  idPerfil: number
  idContenido: number
  idEpisodio?: number
  dispositivo?: string
  pollInterval?: number // milisegundos
}

interface UseReproduccionReturn {
  reproduccionId: number | null
  porcentajeAvance: number
  isReproduciendo: boolean
  iniciar: () => Promise<void>
  actualizar: (porcentaje: number) => Promise<void>
  finalizar: () => Promise<void>
  error: string | null
  isReady: boolean
}

export function useReproduccion({
  idPerfil,
  idContenido,
  idEpisodio,
  dispositivo = 'web',
  pollInterval = 10000, // Cada 10 segundos reporta a Oracle
}: UseReproduccionOptions): UseReproduccionReturn {
  const [reproduccionId, setReproduccionId] = useState<number | null>(null)
  const [porcentajeAvance, setPorcentajeAvance] = useState(0)
  const [isReproduciendo, setIsReproduciendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const ultimoReporteRef = useRef(0)

  const mapDispositivo = (value: string) => {
    const normalizado = value.toLowerCase()
    if (normalizado === 'mobile' || normalizado === 'celular') return 'CELULAR'
    if (normalizado === 'tablet') return 'TABLET'
    if (normalizado === 'tv') return 'TV'
    return 'COMPUTADOR'
  }

  /**
   * Inicia la reproducción: registra en Oracle
   */
  const iniciar = useCallback(async () => {
    try {
      setError(null)
      const response = await reproduccionesAPI.registrar({
        id_perfil: idPerfil,
        id_contenido: idContenido,
        id_episodio: idEpisodio,
        dispositivo: mapDispositivo(dispositivo),
      })
      setReproduccionId(response.id_reproduccion ?? response.id)
      setIsReproduciendo(true)
      setIsReady(true)
    } catch (err: any) {
      setError(err.message || 'Error al iniciar la reproducción')
      setIsReproduciendo(false)
    }
  }, [idPerfil, idContenido, idEpisodio, dispositivo])

  /**
   * Actualiza el porcentaje de avance en Oracle
   */
  const actualizar = useCallback(async (porcentaje: number) => {
    if (!reproduccionId) return

    setPorcentajeAvance(porcentaje)

    // Evitar reportar muy seguido (cada pollInterval)
    const ahora = Date.now()
    if (ahora - ultimoReporteRef.current < pollInterval) return
    ultimoReporteRef.current = ahora

    try {
      await reproduccionesAPI.actualizar(reproduccionId, {
        porcentaje_avance: Math.min(100, porcentaje),
      })
    } catch (err: any) {
      console.error('Error al actualizar avance:', err)
    }
  }, [reproduccionId, pollInterval])

  /**
   * Finaliza la reproducción
   */
  const finalizar = useCallback(async () => {
    if (!reproduccionId) return

    try {
      await reproduccionesAPI.actualizar(reproduccionId, {
        porcentaje_avance: porcentajeAvance,
        fecha_fin: new Date().toISOString(),
      })
    } catch (err: any) {
      console.error('Error al finalizar reproducción:', err)
    } finally {
      setIsReproduciendo(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [reproduccionId, porcentajeAvance])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    reproduccionId,
    porcentajeAvance,
    isReproduciendo,
    iniciar,
    actualizar,
    finalizar,
    error,
    isReady,
  }
}
