'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Play, Star, Search } from 'lucide-react'
import { MainNav } from '@/components/shared/main-nav'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/providers/auth-provider'
import { contenidoAPI } from '@/lib/api'
import { mockContenido, mockPerfiles } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { Contenido, Perfil } from '@/lib/types'

function BuscarContent() {
  const searchParams = useSearchParams()
  const { perfilActivo, perfiles, setPerfilActivo, logout } = useAuth()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [resultados, setResultados] = useState<Contenido[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      buscar(q)
    }
  }, [searchParams])

  const buscar = async (q: string) => {
    if (!q.trim()) return
    setIsLoading(true)
    setSearched(true)
    try {
      const response = await contenidoAPI.buscar(q)
      if (Array.isArray(response)) {
        setResultados(response)
      } else {
        const data = await contenidoAPI.obtenerTodos({ busqueda: q, por_pagina: 20 })
        setResultados(data?.data || [])
      }
    } catch {
      // fallback a busqueda local en mock
      const lowercase = q.toLowerCase()
      const mockResults = mockContenido.filter(
        (c) =>
          c.titulo.toLowerCase().includes(lowercase) ||
          c.sinopsis.toLowerCase().includes(lowercase) ||
          c.generos.some((g) => g.nombre.toLowerCase().includes(lowercase))
      )
      setResultados(mockResults)
    }
    setIsLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      window.history.replaceState(null, '', `/buscar?q=${encodeURIComponent(query)}`)
      buscar(query)
    }
  }

  const perfilParaNav: Perfil = perfilActivo || mockPerfiles[0]
  const listaPerfiles = perfiles.length > 0 ? perfiles : mockPerfiles
  const filtrado = perfilActivo?.es_infantil
    ? resultados.filter((c) => ['TP', '+7', '+13'].includes(c.clasificacion_edad))
    : resultados

  return (
    <div className="min-h-screen bg-background">
      <MainNav perfil={perfilParaNav} perfiles={listaPerfiles} onPerfilChange={setPerfilActivo} onLogout={logout} />
      <main className="pt-24 pb-12 px-4 md:px-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Buscar</h1>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="max-w-2xl mb-8">
          <div className="flex gap-2">
            <Input
              type="search"
              placeholder="Buscar titulos, generos, actores..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 text-lg"
            />
            <Button type="submit" className="h-12 px-6" disabled={isLoading}>
              <Search className="h-5 w-5 mr-2" />
              Buscar
            </Button>
          </div>
        </form>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : searched && filtrado.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Sin resultados</h2>
            <p className="text-muted-foreground">
              No encontramos contenido para &quot;{query}&quot;
            </p>
          </div>
        ) : !searched ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Busca en el catalogo</h2>
            <p className="text-muted-foreground">
              Encuentra tus peliculas, series y mas contenido favorito.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtrado.map((item) => (
              <Link key={item.id} href={`/contenido/${item.id}`} className="group">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary">
                  <Image
                    src={item.poster_url}
                    alt={item.titulo}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                      <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <Badge className={cn(
                    'absolute top-2 right-2 text-xs font-bold',
                    item.clasificacion_edad === 'TP' && 'bg-green-500',
                    item.clasificacion_edad.startsWith('+') && 'bg-yellow-500',
                    item.clasificacion_edad === '+16' && 'bg-orange-500',
                    item.clasificacion_edad === '+18' && 'bg-red-500',
                  )}>
                    {item.clasificacion_edad}
                  </Badge>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                  {item.titulo}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{item.año}</span>
                  {item.calificacion_promedio && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {item.calificacion_promedio.toFixed(1)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function BuscarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BuscarContent />
    </Suspense>
  )
}
