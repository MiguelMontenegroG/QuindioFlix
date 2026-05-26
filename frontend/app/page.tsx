'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Play,
  ChevronRight,
  Star,
  Monitor,
  Download,
  Shield,
  Sparkles,
  Heart,
} from 'lucide-react'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ContentCard } from '@/components/content/content-card'
import { contenidoAPI } from '@/lib/api'
import type { Contenido } from '@/lib/types'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [destacados, setDestacados] = useState<Contenido[]>([])
  const [loadingDestacados, setLoadingDestacados] = useState(true)

  useEffect(() => {
    async function cargarDestacados() {
      try {
        const response = await contenidoAPI.obtenerTodos({ por_pagina: 4 })
        if (response?.data) {
          setDestacados(response.data)
        }
      } catch (err) {
        console.error('Error cargando contenido destacado:', err)
      } finally {
        setLoadingDestacados(false)
      }
    }
    cargarDestacados()
  }, [])

  const features = [
    {
      icon: Monitor,
      title: 'Multi-dispositivo',
      description: 'Ve en tu Smart TV, computador, tablet o celular',
    },
    {
      icon: Download,
      title: 'Descarga offline',
      description: 'Descarga tu contenido favorito y ve sin conexion',
    },
    {
      icon: Shield,
      title: 'Perfiles infantiles',
      description: 'Control parental y contenido seguro para ninos',
    },
    {
      icon: Heart,
      title: 'Contenido colombiano',
      description: 'Descubre historias unicas con sabor a cafe',
    },
  ]

  const planes = [
    {
      nombre: 'Basico',
      precio: '$14.900',
      calidad: 'SD',
      pantallas: 1,
      perfiles: 2,
    },
    {
      nombre: 'Estandar',
      precio: '$24.900',
      calidad: 'HD',
      pantallas: 2,
      perfiles: 3,
      popular: true,
    },
    {
      nombre: 'Premium',
      precio: '$34.900',
      calidad: '4K',
      pantallas: 4,
      perfiles: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[700px] flex flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&h=1080&fit=crop)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Header */}
        <header className="relative z-10 p-4 md:p-8">
          <nav className="container mx-auto flex items-center justify-between">
            <Logo size="lg" />
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-foreground hover:text-primary" asChild>
                <Link href="/login">Iniciar sesion</Link>
              </Button>
              <Button className="bg-primary hover:bg-primary/90" asChild>
                <Link href="/registro">Comenzar</Link>
              </Button>
            </div>
          </nav>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 flex-1 flex items-center">
          <div className="max-w-2xl space-y-8">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                Streaming colombiano con sabor a cafe
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-foreground text-balance leading-tight">
              Historias que
              <span className="block text-primary">conectan</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              Descubre el mejor contenido colombiano y del mundo. Peliculas, series, documentales,
              musica y podcasts en un solo lugar.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Correo electronico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base bg-card border-border"
                />
              </div>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 h-12 px-8 gap-2"
                asChild
              >
                <Link href="/registro">
                  Comenzar
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Listo para empezar? Ingresa tu correo para crear tu cuenta.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 -mt-32 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-8 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Destacados */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Contenido destacado
              </h2>
              <p className="text-muted-foreground mt-2">
                Los titulos mas populares en QuindioFlix
              </p>
            </div>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/login">
                Ver todo
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loadingDestacados ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
                ))}
              </>
            ) : (
              destacados.map((item) => (
                <ContentCard key={item.id} contenido={item} showActions={false} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Elige tu plan
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              El plan que elijas determina la cantidad de perfiles, la calidad de video y
              las pantallas simultaneas que puedes tener.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {planes.map((plan) => (
              <div
                key={plan.nombre}
                className={`relative bg-card border rounded-lg p-8 transition-all hover:scale-105 ${
                  plan.popular
                    ? 'border-primary shadow-xl shadow-primary/10 scale-105'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold">
                    MAS POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.nombre}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">{plan.precio}</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <div className="space-y-3 mb-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <span>Calidad {plan.calidad}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" />
                    <span>{plan.pantallas} pantalla{plan.pantallas > 1 ? 's' : ''} simultanea{plan.pantallas > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    <span>Hasta {plan.perfiles} perfil{plan.perfiles > 1 ? 'es' : ''}</span>
                  </div>
                </div>
                <Button
                  className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href="/registro">Elegir plan</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Que es QuindioFlix?',
                a: 'QuindioFlix es una plataforma de streaming que ofrece contenido multimedia colombiano e internacional, incluyendo peliculas, series, documentales, musica y podcasts.',
              },
              {
                q: 'Cuanto cuesta?',
                a: 'Ofrecemos 3 planes: Basico ($14.900/mes), Estandar ($24.900/mes) y Premium ($34.900/mes). Todos incluyen acceso a todo el catalogo.',
              },
              {
                q: 'Donde puedo ver?',
                a: 'Puedes ver en tu Smart TV, computador, tablet o celular. Todos los planes incluyen acceso multi-dispositivo.',
              },
              {
                q: 'Puedo descargar contenido?',
                a: 'Si, los planes Estandar y Premium incluyen descargas para ver sin conexion a internet.',
              },
              {
                q: 'Como funcionan los perfiles infantiles?',
                a: 'Los perfiles infantiles solo muestran contenido clasificado TP, +7 y +13. Puedes crear hasta 5 perfiles segun tu plan.',
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="bg-card border border-border rounded-lg group"
              >
                <summary className="px-6 py-4 cursor-pointer list-none flex items-center justify-between text-foreground font-semibold hover:text-primary transition-colors">
                  {faq.q}
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-6 pb-4">
                  <p className="text-muted-foreground text-sm">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Listo para empezar?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Crea tu cuenta y comienza a disfrutar del mejor contenido colombiano.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Correo electronico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base bg-card border-border"
              />
            </div>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 h-12 px-8 gap-2"
              asChild
            >
              <Link href="/registro">
                Comenzar
                <Play className="h-5 w-5 fill-current" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo size="sm" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Navegacion</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground transition-colors">Iniciar sesion</Link></li>
                <li><Link href="/registro" className="hover:text-foreground transition-colors">Registrarse</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Ayuda</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Preguntas frecuentes</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Contacto</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Privacidad</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Terminos</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>Proyecto final - Bases de Datos II - Universidad del Quindio</p>
            <p className="mt-1"> 2024 QuindioFlix. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
