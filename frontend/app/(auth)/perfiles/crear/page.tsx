'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/components/providers/auth-provider'
import { perfilesAPI } from '@/lib/api'
import { cn } from '@/lib/utils'

const avatarColors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-red-500',
  'bg-teal-500',
  'bg-indigo-500',
]

const avatarEmojis = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export default function CrearPerfilPage() {
  const router = useRouter()
  const { perfiles, usuario, setPerfilActivo } = useAuth()
  const [nombre, setNombre] = useState('')
  const [esInfantil, setEsInfantil] = useState(false)
  const [avatarIndex, setAvatarIndex] = useState(perfiles.length % avatarColors.length)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre del perfil es obligatorio')
      return
    }
    if (!usuario) {
      setError('Debes iniciar sesión primero')
      return
    }
    setIsSubmitting(true)
    setError('')

    try {
      const nuevoPerfil = await perfilesAPI.crear({
        id_usuario: usuario.id,
        nombre: nombre.trim(),
        es_infantil: esInfantil,
      })

      // Establecer el perfil recién creado como activo
      setPerfilActivo(nuevoPerfil)
    } catch (err: any) {
      setError(err.message || 'Error al crear el perfil')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center gap-4">
        <Link href="/perfiles">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <Link href="/">
          <Logo size="sm" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-center">
          Crear perfil
        </h1>
        <p className="text-muted-foreground mb-10 text-center">
          Elige un nombre y un avatar para tu nuevo perfil
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-8">
          {/* Avatar Selector */}
          <div className="flex flex-col items-center gap-4">
            <Avatar
              className={cn(
                'h-28 w-28 md:h-36 md:w-36 rounded-lg transition-all',
                'ring-4 ring-accent'
              )}
            >
              <AvatarFallback
                className={cn(
                  'text-3xl md:text-4xl font-bold text-white rounded-lg',
                  avatarColors[avatarIndex % avatarColors.length]
                )}
              >
                {avatarEmojis[avatarIndex % avatarEmojis.length]}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-foreground mb-2">
              Nombre del perfil
            </label>
            <Input
              id="nombre"
              type="text"
              placeholder="Ej: Mi perfil, Juan, etc."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={50}
              className="text-center text-lg h-12"
              autoFocus
            />
          </div>

          {/* Kids Profile Toggle */}
          <div className="bg-card border border-border rounded-lg p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-foreground">Perfil infantil</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Solo contenido apto para menores de edad
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEsInfantil(!esInfantil)}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors',
                  esInfantil ? 'bg-accent' : 'bg-secondary'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                    esInfantil ? 'translate-x-6' : 'translate-x-0.5'
                  )}
                />
              </button>
            </label>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 text-center bg-red-500/10 p-3 rounded-lg">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-base gap-2"
            disabled={isSubmitting || !nombre.trim()}
          >
            {isSubmitting ? (
              'Creando...'
            ) : (
              <>
                <Check className="h-5 w-5" />
                Crear perfil
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
