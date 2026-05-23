'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { authAPI, planesAPI } from '@/lib/api'
import type { Plan } from '@/lib/types'

export default function RegistroPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loadingPlanes, setLoadingPlanes] = useState(true)

  useEffect(() => {
    cargarPlanes()
  }, [])

  const cargarPlanes = async () => {
    try {
      // planesAPI.obtenerTodos() ya mapea los datos con mapBackendPlanToFrontend
      // y devuelve { id, nombre, precio, max_pantallas, calidad, max_perfiles, descripcion }
      const data = await planesAPI.obtenerTodos()
      setPlanes(data)
    } catch (error) {
      console.error('Error al cargar planes:', error)
      toast.error('Error al cargar los planes. Recarga la pagina.')
    } finally {
      setLoadingPlanes(false)
    }
  }

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    ciudad: '',
    fecha_nacimiento: '',
    id_plan: 2,
    codigo_referido: '',
  })

  const ciudades = [
    'Armenia', 'Pereira', 'Manizales', 'Bogotá', 'Medellín', 
    'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Ibagué'
  ]

  const updateFormData = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep1 = () => {
    if (!formData.nombre || !formData.email || !formData.password) {
      toast.error('Por favor completa todos los campos obligatorios')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return false
    }
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return false
    }
    return true
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await authAPI.registro({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        telefono: formData.telefono || '',
        ciudad: formData.ciudad || '',
        fecha_nacimiento: formData.fecha_nacimiento || '',
        id_plan: formData.id_plan,
        codigo_referido: formData.codigo_referido || '',
      })

      toast.success(response.mensaje || 'Cuenta creada exitosamente!')
      router.push('/login')
    } catch (error: any) {
      const mensaje = error.message || 'Error al crear la cuenta. Intenta nuevamente.'
      toast.error(mensaje)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 py-12">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=1080&fit=crop)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/70" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-6">
        <Link href="/">
          <Logo size="lg" />
        </Link>
      </header>

      {/* Registration Form */}
      <div className="relative z-10 w-full max-w-2xl mt-16">
        <div className="bg-black/75 backdrop-blur-sm rounded-lg p-8 md:p-12 shadow-2xl">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            )}>
              {step > 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <div className={cn(
              'w-16 h-1 rounded',
              step >= 2 ? 'bg-primary' : 'bg-secondary'
            )} />
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            )}>
              2
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
            {step === 1 ? 'Crear cuenta' : 'Elige tu plan'}
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            {step === 1 
              ? 'Completa tus datos personales'
              : 'Selecciona el plan que mejor se adapte a ti'}
          </p>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre completo *</Label>
                    <Input
                      id="nombre"
                      placeholder="Tu nombre"
                      value={formData.nombre}
                      onChange={(e) => updateFormData('nombre', e.target.value)}
                      className="bg-secondary/50 border-border h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="bg-secondary/50 border-border h-12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        className="bg-secondary/50 border-border h-12 pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repite tu contraseña"
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                      className="bg-secondary/50 border-border h-12"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      type="tel"
                      placeholder="300 123 4567"
                      value={formData.telefono}
                      onChange={(e) => updateFormData('telefono', e.target.value)}
                      className="bg-secondary/50 border-border h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <select
                      id="ciudad"
                      value={formData.ciudad}
                      onChange={(e) => updateFormData('ciudad', e.target.value)}
                      className="w-full h-12 px-3 bg-secondary/50 border border-border rounded-md text-foreground"
                    >
                      <option value="">Selecciona tu ciudad</option>
                      {ciudades.map((ciudad) => (
                        <option key={ciudad} value={ciudad}>{ciudad}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha_nacimiento">Fecha de nacimiento</Label>
                    <Input
                      id="fecha_nacimiento"
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => updateFormData('fecha_nacimiento', e.target.value)}
                      className="bg-secondary/50 border-border h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigo_referido">Código de referido (opcional)</Label>
                    <Input
                      id="codigo_referido"
                      placeholder="Ej: AMIGO2024"
                      value={formData.codigo_referido}
                      onChange={(e) => updateFormData('codigo_referido', e.target.value)}
                      className="bg-secondary/50 border-border h-12"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold"
                >
                  Continuar
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {loadingPlanes ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Cargando planes...</span>
                  </div>
                ) : (
                <RadioGroup
                  value={String(formData.id_plan)}
                  onValueChange={(value) => updateFormData('id_plan', parseInt(value))}
                  className="space-y-4"
                >
                  {planes.map((plan) => (
                    <label
                      key={plan.id}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all',
                        formData.id_plan === plan.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <RadioGroupItem value={String(plan.id)} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg">{plan.nombre}</h3>
                          <span className="text-2xl font-bold text-primary">
                            ${plan.precio.toLocaleString('es-CO')}
                            <span className="text-sm text-muted-foreground font-normal">/mes</span>
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.descripcion}
                        </p>
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-500" />
                            {plan.max_pantallas} pantalla{plan.max_pantallas > 1 && 's'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-500" />
                            Calidad {plan.calidad}
                          </span>
                          <span className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-500" />
                            {plan.max_perfiles} perfiles
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
                )}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12"
                  >
                    Atras
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-primary hover:bg-primary/90 font-semibold"
                    disabled={isLoading || loadingPlanes}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      'Crear cuenta'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
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
