'use client'

import { useState, useEffect } from 'react'
import { MainNav } from '@/components/shared/main-nav'
import { ContentCarousel } from '@/components/content/content-carousel'
import { useAuth } from '@/components/providers/auth-provider'
import { contenidoAPI, favoritosAPI } from '@/lib/api'
import { mockContenido, mockPerfiles } from '@/lib/mock-data'
import type { Contenido, Perfil } from '@/lib/types'

export default function MusicaPage() {
  const { perfilActivo, perfiles, setPerfilActivo, logout } = useAuth()
  const [contenido, setContenido] = useState<Contenido[]>([])
  const [favoritos, setFavoritos] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const response = await contenidoAPI.obtenerTodos({ categoria: 'musica', por_pagina: 50 })
        if (response?.data) setContenido(response.data)
      } catch { setContenido(mockContenido.filter((c) => c.categoria === 'musica')) }
      if (perfilActivo) {
        try { const favs = await favoritosAPI.obtenerPorPerfil(perfilActivo.id); setFavoritos(favs.map((f) => f.id_contenido)) } catch {}
      }
      setIsLoading(false)
    }
    cargar()
  }, [perfilActivo])

  const handleFavoriteToggle = async (id: number) => {
    if (!perfilActivo) return
    try {
      if (favoritos.includes(id)) { await favoritosAPI.eliminar(perfilActivo.id, id); setFavoritos((prev) => prev.filter((fav) => fav !== id)) }
      else { await favoritosAPI.agregar(perfilActivo.id, id); setFavoritos((prev) => [...prev, id]) }
    } catch { setFavoritos((prev) => prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]) }
  }

  const perfilParaNav: Perfil = perfilActivo || mockPerfiles[0]
  const listaPerfiles = perfiles.length > 0 ? perfiles : mockPerfiles
  const filtrado = perfilActivo?.es_infantil ? contenido.filter((c) => ['TP', '+7', '+13'].includes(c.clasificacion_edad)) : contenido

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-background">
      <MainNav perfil={perfilParaNav} perfiles={listaPerfiles} onPerfilChange={setPerfilActivo} onLogout={logout} />
      <main className="pt-24 pb-12 px-4 md:px-12">
        <h1 className="text-4xl font-bold text-foreground mb-8">Musica</h1>
        {filtrado.length > 0 ? <ContentCarousel title="Musica" contenido={filtrado} favoritos={favoritos} onFavoriteToggle={handleFavoriteToggle} /> : <p className="text-muted-foreground">No hay contenido musical disponible.</p>}
      </main>
    </div>
  )
}
