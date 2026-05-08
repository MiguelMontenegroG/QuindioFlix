'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Por favor ingresa tu correo electrónico')
      return
    }

    setIsLoading(true)

    try {
      // Simulación - en producción conectar con FastAPI
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setSent(true)
      toast.success('Correo de recuperación enviado')
    } catch {
      toast.error('Error al enviar el correo. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&h=1080&fit=crop)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/60" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-6">
        <Link href="/">
          <Logo size="lg" />
        </Link>
      </header>

      {/* Form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-black/75 backdrop-blur-sm rounded-lg p-8 md:p-12 shadow-2xl">
          {!sent ? (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </Link>

              <h1 className="text-3xl font-bold text-foreground mb-2">
                Recuperar contraseña
              </h1>
              <p className="text-muted-foreground mb-8">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-secondary/50 border-border h-12 pl-10"
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar enlace de recuperación'
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Correo enviado
              </h1>
              <p className="text-muted-foreground mb-8">
                Si existe una cuenta con el correo {email}, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <Button
                variant="outline"
                className="h-12"
                asChild
              >
                <Link href="/login">
                  Volver al inicio de sesión
                </Link>
              </Button>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              ¿Recuerdas tu contraseña?{' '}
              <Link
                href="/login"
                className="text-foreground hover:text-primary font-semibold transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
