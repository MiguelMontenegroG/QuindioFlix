'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Plus, Check, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { reproduccionesAPI } from '@/lib/api'
import { getPerfilActivo } from '@/lib/auth'
import { toast } from 'sonner'
import type { Contenido } from '@/lib/types'

interface ContentCardProps {
  contenido: Contenido
  variant?: 'default' | 'wide' | 'compact'
  showActions?: boolean
  isFavorite?: boolean
  onFavoriteToggle?: (id: number) => void
  className?: string
}

export function ContentCard({
  contenido,
  variant = 'default',
  showActions = true,
  isFavorite = false,
  onFavoriteToggle,
  className,
}: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const aspectRatios = {
    default: 'aspect-[2/3]',
    wide: 'aspect-video',
    compact: 'aspect-[4/3]',
  }

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'pelicula': 'bg-blue-500/20 text-blue-400',
      'serie': 'bg-purple-500/20 text-purple-400',
      'documental': 'bg-green-500/20 text-green-400',
      'musica': 'bg-orange-500/20 text-orange-400',
      'podcast': 'bg-pink-500/20 text-pink-400',
    }
    return colors[categoria] || 'bg-muted text-muted-foreground'
  }

  const getClassificationColor = (clasificacion: string) => {
    const colors: Record<string, string> = {
      'TP': 'bg-green-500/80 text-white',
      '+7': 'bg-green-600/80 text-white',
      '+13': 'bg-yellow-500/80 text-black',
      '+16': 'bg-orange-500/80 text-white',
      '+18': 'bg-red-500/80 text-white',
    }
    return colors[clasificacion] || 'bg-muted'
  }

    const handlePlay = async (e: React.MouseEvent) => {
    e.preventDefault()
    const perfil = getPerfilActivo()
    if (!perfil) {
      toast.error('Debes iniciar sesion para reproducir')
      return
    }
    try {
      await reproduccionesAPI.registrar({
        id_perfil: perfil.id,
        id_contenido: contenido.id,
        dispositivo: 'COMPUTADOR',
      })
      toast.success('Reproduccion registrada')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      if (msg.toLowerCase().includes('desactivada')) {
        toast.error('Tu cuenta esta desactivada. No puedes reproducir contenido.')
      } else {
        toast.error('Error al registrar reproduccion: ' + msg)
      }
    }
  }

  return (
    <div
      className={cn(
        'group relative rounded-lg overflow-hidden bg-card transition-all duration-300',
        'hover:scale-105 hover:z-10 hover:shadow-xl hover:shadow-primary/10',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster Image */}
      <div className={cn('relative', aspectRatios[variant])}>
        <Image
          src={contenido.poster_url}
          alt={contenido.titulo}
          fill
          className={cn(
            'object-cover transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />

        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Classification Badge */}
        <Badge
          className={cn(
            'absolute top-2 right-2 text-xs font-bold',
            getClassificationColor(contenido.clasificacion_edad)
          )}
        >
          {contenido.clasificacion_edad}
        </Badge>

        {/* Original Badge */}
        {contenido.es_original && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs">
            Original
          </Badge>
        )}

        {/* Hover Content */}
        {showActions && isHovered && (
          <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Actions */}
            <div className="flex items-center gap-2 mb-2">
              <Button
                size="icon"
                className="h-9 w-9 rounded-full bg-white text-black hover:bg-white/90"
                onClick={handlePlay}
              >
                <Play className="h-4 w-4 fill-current" />
              </Button>

              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full border-white/50 bg-black/50 hover:bg-black/70"
                onClick={(e) => {
                  e.preventDefault()
                  onFavoriteToggle?.(contenido.id)
                }}
              >
                {isFavorite ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>

              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 rounded-full border-white/50 bg-black/50 hover:bg-black/70 ml-auto"
                asChild
              >
                <Link href={`/contenido/${contenido.id}`}>
                  <Info className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Quick Info */}
            <div className="space-y-1">
              <h3 className="font-semibold text-sm line-clamp-1 text-white">
                {contenido.titulo}
              </h3>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span>{contenido.año}</span>
                {contenido.duracion_minutos && (
                  <>
                    <span>•</span>
                    <span>{contenido.duracion_minutos} min</span>
                  </>
                )}
                {contenido.calificacion_promedio && (
                  <>
                    <span>•</span>
                    <span className="text-yellow-400">
                      ★ {contenido.calificacion_promedio.toFixed(1)}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant="secondary"
                  className={cn('text-xs', getCategoryColor(contenido.categoria))}
                >
                  {contenido.categoria}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Title (visible when not hovered) */}
      {variant !== 'compact' && (
        <div className="p-2 group-hover:opacity-0 transition-opacity">
          <h3 className="font-medium text-sm truncate text-foreground">
            {contenido.titulo}
          </h3>
          <p className="text-xs text-muted-foreground">{contenido.año}</p>
        </div>
      )}
    </div>
  )
}