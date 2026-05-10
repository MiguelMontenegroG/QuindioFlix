'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Settings, Pencil } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-provider'


import { PLANES } from '@/lib/constants'
import type { Perfil } from '@/lib/types'

export default function PerfilesPage() {
  const router = useRouter()
  const { perfiles, usuario, setPerfilActivo, isAuthenticated } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  const plan = Object.values(PLANES).find((p) => p.id === usuario?.id_plan)
  const puedeCrearPerfil = perfiles.length < (plan?.maxPerfiles || 2)

  const handleSelectPerfil = (perfil: Perfil) => {
    if (isEditing) {
      router.push(`/perfiles/editar/${perfil.id}`)
    } else {
      setPerfilActivo(perfil)
    }
  }

  const avatarColors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <Link href="/">
          <Logo size="md" />
        </Link>
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Listo' : 'Administrar perfiles'}
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-center">
          {isEditing ? 'Administrar perfiles' : '¿Quién está viendo?'}
        </h1>
        <p className="text-muted-foreground mb-12 text-center">
          {isEditing 
            ? 'Selecciona un perfil para editarlo'
            : 'Selecciona tu perfil para continuar'}
        </p>

        {/* Perfiles Grid */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-4xl">
          {perfiles.map((perfil, index) => (
            <button
              key={perfil.id}
              onClick={() => handleSelectPerfil(perfil)}
              className="group flex flex-col items-center gap-3 outline-none"
            >
              <div className="relative">
                <Avatar
                  className={cn(
                    'h-24 w-24 md:h-32 md:w-32 rounded-lg transition-all duration-200',
                    'ring-4 ring-transparent group-hover:ring-foreground group-focus:ring-foreground',
                    isEditing && 'opacity-50'
                  )}
                >
                  <AvatarImage 
                    src={perfil.avatar} 
                    alt={perfil.nombre}
                    className="object-cover"
                  />
                  <AvatarFallback 
                    className={cn(
                      'text-2xl md:text-3xl font-bold text-white rounded-lg',
                      avatarColors[index % avatarColors.length]
                    )}
                  >
                    {perfil.nombre.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Edit overlay */}
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                    <Pencil className="h-8 w-8 text-white" />
                  </div>
                )}

                {/* Kids badge */}
                {perfil.es_infantil && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded">
                    NIÑOS
                  </span>
                )}
              </div>

              <span className={cn(
                'text-sm md:text-base font-medium transition-colors',
                'text-muted-foreground group-hover:text-foreground group-focus:text-foreground'
              )}>
                {perfil.nombre}
              </span>
            </button>
          ))}

          {/* Add Profile Button */}
          {puedeCrearPerfil && (
            <Link
              href="/perfiles/crear"
              className="group flex flex-col items-center gap-3 outline-none"
            >
              <div className={cn(
                'h-24 w-24 md:h-32 md:w-32 rounded-lg transition-all duration-200',
                'flex items-center justify-center',
                'bg-secondary/50 border-2 border-dashed border-muted-foreground/30',
                'group-hover:border-foreground group-hover:bg-secondary',
                'group-focus:border-foreground group-focus:bg-secondary'
              )}>
                <Plus className="h-12 w-12 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <span className="text-sm md:text-base font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Agregar perfil
              </span>
            </Link>
          )}
        </div>

        {/* Plan info */}
        {plan && (
          <p className="mt-12 text-sm text-muted-foreground">
            Plan {plan.nombre}: {perfiles.length} de {plan.max_perfiles} perfiles usados
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="p-6 flex justify-center">
        <Link href="/mi-cuenta">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground gap-2">
            <Settings className="h-4 w-4" />
            Configuracion de cuenta
          </Button>
        </Link>
      </footer>
    </div>
  )
}
