'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Plus, Check, Info, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Contenido } from '@/lib/types'

interface HeroBannerProps {
  contenido: Contenido
  isFavorite?: boolean
  onFavoriteToggle?: (id: number) => void
  className?: string
}

export function HeroBanner({
  contenido,
  isFavorite = false,
  onFavoriteToggle,
  className,
}: HeroBannerProps) {
  const [isMuted, setIsMuted] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)

  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  return (
    <section className={cn('relative h-[80vh] min-h-[600px] w-full', className)}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={contenido.banner_url || contenido.poster_url}
          alt={contenido.titulo}
          fill
          className={cn(
            'object-cover object-center transition-opacity duration-700',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          priority
          sizes="100vw"
        />
        
        {/* Loading state */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 md:px-12 flex flex-col justify-center">
        <div className="max-w-2xl space-y-6">
          {/* Badges */}
          <div className="flex items-center gap-3">
            {contenido.es_original && (
              <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1">
                ORIGINAL QUINDIOFLIX
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="bg-white/10 text-white border-white/20"
            >
              {contenido.categoria.toUpperCase()}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground text-balance leading-tight">
            {contenido.titulo}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm md:text-base text-muted-foreground">
            <span className="text-green-500 font-semibold">
              {contenido.calificacion_promedio
                ? `${(contenido.calificacion_promedio * 20).toFixed(0)}% coincidencia`
                : 'Nuevo'}
            </span>
            <span>{contenido.año}</span>
            {contenido.duracion_minutos && (
              <span>
                {contenido.categoria === 'Serie' || contenido.categoria === 'Podcast'
                  ? `${contenido.duracion_minutos} min/ep`
                  : `${Math.floor(contenido.duracion_minutos / 60)}h ${contenido.duracion_minutos % 60}min`}
              </span>
            )}
            <Badge
              variant="outline"
              className="border-white/30 text-white text-xs"
            >
              {contenido.clasificacion_edad}
            </Badge>
          </div>

          {/* Synopsis */}
          <p className="text-base md:text-lg text-foreground/80 line-clamp-3 max-w-xl">
            {contenido.sinopsis}
          </p>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {contenido.generos.map((genero) => (
              <span
                key={genero.id}
                className="text-sm text-muted-foreground"
              >
                {genero.nombre}
                {contenido.generos.indexOf(genero) < contenido.generos.length - 1 && (
                  <span className="mx-2">•</span>
                )}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-white/90 font-semibold px-8"
              asChild
            >
              <Link href={`/ver/${contenido.id}`}>
                <Play className="mr-2 h-5 w-5 fill-current" />
                Reproducir
              </Link>
            </Button>

            <Button
              size="lg"
              variant="secondary"
              className="bg-white/20 text-white hover:bg-white/30 font-semibold px-8"
              asChild
            >
              <Link href={`/contenido/${contenido.id}`}>
                <Info className="mr-2 h-5 w-5" />
                Más información
              </Link>
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-full border-white/30 bg-black/30 hover:bg-black/50"
              onClick={() => onFavoriteToggle?.(contenido.id)}
            >
              {isFavorite ? (
                <Check className="h-5 w-5 text-green-400" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Volume Control (for video backgrounds) */}
        <Button
          size="icon"
          variant="outline"
          className="absolute bottom-32 right-12 h-10 w-10 rounded-full border-white/30 bg-black/30 hover:bg-black/50"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </section>
  )
}
