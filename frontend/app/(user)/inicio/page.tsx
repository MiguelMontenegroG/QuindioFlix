'use client'

import { useState, useEffect, useCallback } from 'react'
import { MainNav } from '@/components/shared/main-nav'
import { HeroBanner } from '@/components/content/hero-banner'
import { ContentCarousel } from '@/components/content/content-carousel'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/components/providers/auth-provider'
import { contenidoAPI, favoritosAPI } from '@/lib/api'
import type { Contenido } from '@/lib/types'

const CLASIFICACIONES_INFANTILES = ['TP', '+7', '+13']

export default function HomePage() {
  const { perfilActivo, perfiles, setPerfilActivo, logout } = useAuth()

  const [allContent, setAllContent] = useState<Contenido[]>([])
  const [favoritos, setFavoritos] = useState<number[]>([])
  const [contenidoRecomendado, setContenidoRecomendado] = useState<Contenido | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!perfilActivo) {
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const [contentResult, favsResult, recomendado] = await Promise.all([
          contenidoAPI.obtenerTodos({ por_pagina: 50 }),
          favoritosAPI.obtenerPorPerfil(perfilActivo.id),
          contenidoAPI.obtenerRecomendado(perfilActivo.id).catch(() => null),
        ])

        setAllContent(contentResult.data)
        setFavoritos(favsResult.map(f => f.id_contenido))
        setContenidoRecomendado(recomendado)
      } catch (err) {
        console.error('Error cargando datos del home:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [perfilActivo])

  const handleFavoriteToggle = useCallback(async (idContenido: number) => {
    if (!perfilActivo) return

    const esFavorito = favoritos.includes(idContenido)

    setFavoritos(prev =>
      esFavorito
        ? prev.filter(id => id !== idContenido)
        : [...prev, idContenido]
    )

    try {
      if (esFavorito) {
        await favoritosAPI.eliminar(perfilActivo.id, idContenido)
      } else {
        await favoritosAPI.agregar(perfilActivo.id, idContenido)
      }
    } catch (err) {
      console.error('Error al actualizar favorito:', err)
      setFavoritos(prev =>
        esFavorito
          ? [...prev, idContenido]
          : prev.filter(id => id !== idContenido)
      )
    }
  }, [perfilActivo, favoritos])

  const contenidoFiltrado = perfilActivo?.es_infantil
    ? allContent.filter(c => CLASIFICACIONES_INFANTILES.includes(c.clasificacion_edad))
    : allContent

  const peliculas = contenidoFiltrado.filter(c => c.categoria === 'Pelicula')
  const series = contenidoFiltrado.filter(c => c.categoria === 'Serie')
  const documentales = contenidoFiltrado.filter(c => c.categoria === 'Documental')
  const musica = contenidoFiltrado.filter(c => c.categoria === 'Musica')
  const podcasts = contenidoFiltrado.filter(c => c.categoria === 'Podcast')
  const originales = contenidoFiltrado.filter(c => c.es_original)
  const populares = [...contenidoFiltrado].sort(
    (a, b) => (b.total_reproducciones || 0) - (a.total_reproducciones || 0)
  )
  const mejorCalificados = [...contenidoFiltrado].sort(
    (a, b) => (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0)
  )

  const contenidoDestacado = contenidoRecomendado || originales[0] || populares[0] || contenidoFiltrado[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background/95 via-background/80 to-transparent backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-8 w-32" />
              <div className="hidden lg:flex items-center gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-16" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full hidden md:flex" />
                <Skeleton className="h-9 w-20 rounded-md" />
              </div>
            </div>
          </div>
        </header>

        <div className="relative h-[80vh] min-h-[600px] w-full bg-muted animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="relative h-full container mx-auto px-4 md:px-12 flex flex-col justify-center">
            <div className="max-w-2xl space-y-6">
              <div className="flex gap-3">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-16 w-3/4" />
              <div className="flex gap-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-12" />
              </div>
              <Skeleton className="h-12 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-12 w-40 rounded-lg" />
                <Skeleton className="h-12 w-48 rounded-lg" />
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 -mt-32 space-y-8 pb-16 px-4 md:px-12">
          {Array.from({ length: 5 }).map((_, sectionIdx) => (
            <div key={sectionIdx} className="space-y-4">
              <Skeleton className="h-7 w-56" />
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 6 }).map((_, cardIdx) => (
                  <Skeleton
                    key={cardIdx}
                    className="shrink-0 aspect-[2/3] w-[180px] rounded-lg"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <footer className="border-t border-border py-8 px-4 md:px-12">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-5 w-28" />
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-32" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav
        perfil={perfilActivo}
        perfiles={perfiles}
        onPerfilChange={setPerfilActivo}
        onLogout={logout}
      />

      <main>
        {contenidoDestacado && (
          <HeroBanner
            contenido={contenidoDestacado}
            isFavorite={favoritos.includes(contenidoDestacado.id)}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )}

        <div className="relative z-10 -mt-32 space-y-8 pb-16">
          {populares.length > 0 && (
            <ContentCarousel
              title="Tendencias en Colombia"
              contenido={populares.slice(0, 10)}
              favoritos={favoritos}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {originales.length > 0 && (
            <ContentCarousel
              title="Originales QuindioFlix"
              contenido={originales}
              variant="wide"
              favoritos={favoritos}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {peliculas.length > 0 && (
            <ContentCarousel
              title="Peliculas"
              contenido={peliculas}
              favoritos={favoritos}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {series.length > 0 && (
            <ContentCarousel
              title="Series"
              contenido={series}
              favoritos={favoritos}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {mejorCalificados.length > 0 && (
            <ContentCarousel
              title="Mejor calificados"
              contenido={mejorCalificados.slice(0, 10)}
              favoritos={favoritos}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {documentales.length > 0 && (
            <ContentCarousel
              title="Documentales"
              contenido={documentales}
              favoritos={favoritos}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {musica.length > 0 && (
            <ContentCarousel
              title="Musica"
              contenido={musica}
              favoritos={favoritos}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {podcasts.length > 0 && (
            <ContentCarousel
              title="Podcasts"
              contenido={podcasts}
              favoritos={favoritos}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-border py-8 px-4 md:px-12">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-3">QuindioFlix</h4>
              <ul className="space-y-2">
                <li><a href="/sobre-nosotros" className="hover:text-foreground transition-colors">Sobre nosotros</a></li>
                <li><a href="/empleo" className="hover:text-foreground transition-colors">Empleo</a></li>
                <li><a href="/prensa" className="hover:text-foreground transition-colors">Prensa</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Ayuda</h4>
              <ul className="space-y-2">
                <li><a href="/faq" className="hover:text-foreground transition-colors">Preguntas frecuentes</a></li>
                <li><a href="/contacto" className="hover:text-foreground transition-colors">Contacto</a></li>
                <li><a href="/soporte" className="hover:text-foreground transition-colors">Soporte</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/terminos" className="hover:text-foreground transition-colors">Terminos de uso</a></li>
                <li><a href="/privacidad" className="hover:text-foreground transition-colors">Privacidad</a></li>
                <li><a href="/cookies" className="hover:text-foreground transition-colors">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Universidad del Quindio</h4>
              <p className="text-xs">
                Proyecto final - Bases de Datos II
              </p>
              <p className="text-xs mt-2">
                &copy; 2024 QuindioFlix. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
