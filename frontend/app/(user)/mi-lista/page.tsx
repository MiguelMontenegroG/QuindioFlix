'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Play, Heart, Star, Trash2 } from 'lucide-react'
import { MainNav } from '@/components/shared/main-nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/providers/auth-provider'
import { contenidoAPI, favoritosAPI } from '@/lib/api'
import { mockContenido, mockPerfiles } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { Contenido, Perfil } from '@/lib/types'

export default function MiListaPage() {
  const { perfilActivo, perfiles, setPerfilActivo, logout } = useAuth()
  const [lista, setLista] = useState<Contenido[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      if (!perfilActivo) {
        setIsLoading(false)
        return
      }
      try {
        const favs = await favoritosAPI.obtenerPorPerfil(perfilActivo.id)
        const idsContenido = favs.map((f) => f.id_contenido)
        if (idsContenido.length > 0) {
          const response = await contenidoAPI.obtenerTodos({ por_pagina: 50 })
          if (response?.data) {
            setLista(response.data.filter((c) => idsContenido.includes(c.id)))
          }
        }
      } catch {
        // fallback a mock
        setLista(mockContenido.slice(0, 4))
      }
      setIsLoading(false)
    }
    cargar()
  }, [perfilActivo])

  const eliminarFavorito = async (idContenido: number) => {
    if (!perfilActivo) return
    try {
      await favoritosAPI.eliminar(perfilActivo.id, idContenido)
      setLista((prev) => prev.filter((c) => c.id !== idContenido))
    } catch {}
  }

  const perfilParaNav: Perfil = perfilActivo || mockPerfiles[0]
  const listaPerfiles = perfiles.length > 0 ? perfiles : mockPerfiles

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav perfil={perfilParaNav} perfiles={listaPerfiles} onPerfilChange={setPerfilActivo} onLogout={logout} />
      <main className="pt-24 pb-12 px-4 md:px-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Mi Lista</h1>

        {lista.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Tu lista esta vacia</h2>
            <p className="text-muted-foreground mb-6">
              Agrega contenido a tu lista para verlo despues.
            </p>
            <Button asChild>
              <Link href="/inicio">Explorar catalogo</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {lista.map((item) => (
              <div key={item.id} className="group relative">
                <Link href={`/contenido/${item.id}`}>
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
                <button
                  onClick={() => eliminarFavorito(item.id)}
                  className="absolute top-2 left-2 p-1.5 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                  title="Eliminar de mi lista"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
