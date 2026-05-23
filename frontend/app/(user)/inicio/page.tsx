'use client'

import { useState } from 'react'
import { MainNav } from '@/components/shared/main-nav'
import { HeroBanner } from '@/components/content/hero-banner'
import { ContentCarousel } from '@/components/content/content-carousel'
import { mockContenido, mockPerfiles } from '@/lib/mock-data'
import type { Perfil } from '@/lib/types'

export default function HomePage() {
  const [perfilActivo, setPerfilActivo] = useState<Perfil>(mockPerfiles[0])
  const [favoritos, setFavoritos] = useState<number[]>([1, 4, 5])

  const handleFavoriteToggle = (id: number) => {
    setFavoritos((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    )
  }

  const handleLogout = () => {
    window.location.href = '/login'
  }

  // Filtrar contenido según el perfil (infantil solo ve TP, +7, +13)
  const contenidoFiltrado = perfilActivo.es_infantil
    ? mockContenido.filter((c) =>
        ['TP', '+7', '+13'].includes(c.clasificacion_edad)
      )
    : mockContenido

  // Organizar contenido por categorías
  const peliculas = contenidoFiltrado.filter((c) => c.categoria === 'Pelicula')
  const series = contenidoFiltrado.filter((c) => c.categoria === 'Serie')
  const documentales = contenidoFiltrado.filter((c) => c.categoria === 'Documental')
  const musica = contenidoFiltrado.filter((c) => c.categoria === 'Musica')
  const podcasts = contenidoFiltrado.filter((c) => c.categoria === 'Podcast')
  const originales = contenidoFiltrado.filter((c) => c.es_original)
  const populares = [...contenidoFiltrado].sort(
    (a, b) => (b.total_reproducciones || 0) - (a.total_reproducciones || 0)
  )
  const mejorCalificados = [...contenidoFiltrado].sort(
    (a, b) => (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0)
  )

  // Contenido destacado para el hero
  const contenidoDestacado = originales[0] || populares[0]

  return (
    <div className="min-h-screen bg-background">
      <MainNav
        perfil={perfilActivo}
        perfiles={mockPerfiles}
        onPerfilChange={setPerfilActivo}
        onLogout={handleLogout}
      />

      <main>
        {/* Hero Banner */}
        {contenidoDestacado && (
          <HeroBanner
            contenido={contenidoDestacado}
            isFavorite={favoritos.includes(contenidoDestacado.id)}
            onFavoriteToggle={handleFavoriteToggle}
          />
        )}

        {/* Content Carousels */}
        <div className="relative z-10 -mt-32 space-y-8 pb-16">
          {/* Trending / Popular */}
          <ContentCarousel
            title="Tendencias en Colombia"
            contenido={populares.slice(0, 10)}
            favoritos={favoritos}
            onFavoriteToggle={handleFavoriteToggle}
            showAllLink="/populares"
          />

          {/* Originales QuindioFlix */}
          {originales.length > 0 && (
            <ContentCarousel
              title="Originales QuindioFlix"
              contenido={originales}
              variant="wide"
              favoritos={favoritos}
              onFavoriteToggle={handleFavoriteToggle}
              showAllLink="/originales"
            />
          )}

          {/* Películas */}
          {peliculas.length > 0 && (
            <ContentCarousel
              title="Películas"
              contenido={peliculas}
              favoritos={favoritos}
              onFavoriteToggle={handleFavoriteToggle}
              showAllLink="/peliculas"
            />
          )}

          {/* Series */}
          {series.length > 0 && (
            <ContentCarousel
              title="Series"
              contenido={series}
              favoritos={favoritos}
              onFavoriteToggle={handleFavoriteToggle}
              showAllLink="/series"
            />
          )}

          {/* Mejor Calificados */}
          <ContentCarousel
            title="Mejor calificados"
            contenido={mejorCalificados.slice(0, 10)}
            favoritos={favoritos}
            onFavoriteToggle={handleFavoriteToggle}
          />

          {/* Documentales */}
          {documentales.length > 0 && (
            <ContentCarousel
              title="Documentales"
              contenido={documentales}
              favoritos={favoritos}
              onFavoriteToggle={handleFavoriteToggle}
              showAllLink="/documentales"
            />
          )}

          {/* Música */}
          {musica.length > 0 && (
            <ContentCarousel
              title="Música"
              contenido={musica}
              favoritos={favoritos}
              onFavoriteToggle={handleFavoriteToggle}
              showAllLink="/musica"
            />
          )}

          {/* Podcasts */}
          {podcasts.length > 0 && (
            <ContentCarousel
              title="Podcasts"
              contenido={podcasts}
              favoritos={favoritos}
              onFavoriteToggle={handleFavoriteToggle}
              showAllLink="/podcasts"
            />
          )}
        </div>
      </main>

      {/* Footer */}
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
                <li><a href="/terminos" className="hover:text-foreground transition-colors">Términos de uso</a></li>
                <li><a href="/privacidad" className="hover:text-foreground transition-colors">Privacidad</a></li>
                <li><a href="/cookies" className="hover:text-foreground transition-colors">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Universidad del Quindío</h4>
              <p className="text-xs">
                Proyecto final - Bases de Datos II
              </p>
              <p className="text-xs mt-2">
                © 2024 QuindioFlix. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
