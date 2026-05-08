'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Clock, Trash2, Filter, Calendar, Monitor, Smartphone, Tv } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockReproducciones, mockContenido } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export default function HistorialPage() {
  const [filter, setFilter] = useState<string>('todos')

  const reproduccionesConContenido = mockReproducciones.map((rep) => ({
    ...rep,
    contenido: mockContenido.find((c) => c.id === rep.id_contenido),
  }))

  const filteredHistorial = reproduccionesConContenido.filter((rep) => {
    if (filter === 'todos') return true
    if (filter === 'completado') return rep.porcentaje_avance === 100
    if (filter === 'en-progreso') return rep.porcentaje_avance > 0 && rep.porcentaje_avance < 100
    return true
  })

  const getDeviceIcon = (dispositivo: string) => {
    switch (dispositivo) {
      case 'web': return <Monitor className="h-4 w-4" />
      case 'mobile': return <Smartphone className="h-4 w-4" />
      case 'tv': return <Tv className="h-4 w-4" />
      default: return <Monitor className="h-4 w-4" />
    }
  }

  const getDispositivoLabel = (dispositivo: string) => {
    switch (dispositivo) {
      case 'web': return 'Web'
      case 'mobile': return 'Móvil'
      case 'tv': return 'Smart TV'
      default: return dispositivo
    }
  }

  const stats = {
    total: mockReproducciones.length,
    completadas: mockReproducciones.filter((r) => r.porcentaje_avance === 100).length,
    enProgreso: mockReproducciones.filter((r) => r.porcentaje_avance > 0 && r.porcentaje_avance < 100).length,
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Historial de Reproducciones</h1>
            <p className="text-muted-foreground">
              Contenido que has visto recientemente
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Total reproducciones</p>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Completados</p>
            <p className="text-3xl font-bold text-green-500">{stats.completadas}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">En progreso</p>
            <p className="text-3xl font-bold text-yellow-500">{stats.enProgreso}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('todos')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'completado' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completado')}
          >
            Completados
          </Button>
          <Button
            variant={filter === 'en-progreso' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('en-progreso')}
          >
            En progreso
          </Button>
        </div>

        {/* Historial */}
        <div className="space-y-3">
          {filteredHistorial.map((rep) => (
            <div
              key={rep.id}
              className="bg-card border border-border rounded-lg p-4 hover:border-accent transition-colors group"
            >
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0 bg-secondary">
                  {rep.contenido && (
                    <Image
                      src={rep.contenido.poster_url}
                      alt={rep.contenido.titulo}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/reproductor/${rep.id_contenido}`}>
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                        <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/contenido/${rep.id_contenido}`}>
                    <h3 className="font-semibold text-foreground truncate hover:text-accent transition-colors">
                      {rep.contenido?.titulo || 'Contenido eliminado'}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(rep.fecha_inicio).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      {getDeviceIcon(rep.dispositivo)}
                      {getDispositivoLabel(rep.dispositivo)}
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            rep.porcentaje_avance === 100
                              ? 'bg-green-500'
                              : 'bg-accent'
                          )}
                          style={{ width: `${rep.porcentaje_avance}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {rep.porcentaje_avance}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {rep.porcentaje_avance < 100 && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/reproductor/${rep.id_contenido}`}>
                        <Play className="h-4 w-4 mr-1" />
                        Continuar
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredHistorial.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-lg">
            <Clock className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Sin historial</h2>
            <p className="text-muted-foreground text-center max-w-md">
              No tienes reproducciones registradas. Comienza a ver contenido para que aparezca aquí.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/inicio">Explorar catálogo</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
