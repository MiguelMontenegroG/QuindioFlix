'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Play,
  Plus,
  Check,
  ThumbsUp,
  Share2,
  Flag,
  ChevronDown,
  Star,
  Clock,
  Calendar,
} from 'lucide-react'
import { MainNav } from '@/components/shared/main-nav'
import { ContentCarousel } from '@/components/content/content-carousel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { mockContenido, mockTemporadas, mockPerfiles } from '@/lib/mock-data'

export default function ContenidoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  
  const contenido = mockContenido.find((c) => c.id === id)
  const temporadas = mockTemporadas.filter((t) => t.id_contenido === id)
  
  const [isFavorite, setIsFavorite] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [selectedTemporada, setSelectedTemporada] = useState(temporadas[0]?.id || null)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)
  const [reportMotivo, setReportMotivo] = useState('')
  const [reportDescripcion, setReportDescripcion] = useState('')

  if (!contenido) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Contenido no encontrado</h1>
          <Button onClick={() => router.push('/inicio')}>Volver al inicio</Button>
        </div>
      </div>
    )
  }

  const relacionados = mockContenido
    .filter((c) => c.id !== id && c.generos.some((g) => 
      contenido.generos.map((cg) => cg.id).includes(g.id)
    ))
    .slice(0, 10)

  const temporadaActual = temporadas.find((t) => t.id === selectedTemporada)
  const esSerie = contenido.categoria === 'serie' || contenido.categoria === 'podcast'

  const handleReport = () => {
    if (!reportMotivo) {
      toast.error('Selecciona un motivo para el reporte')
      return
    }
    toast.success('Reporte enviado. Nuestro equipo lo revisará pronto.')
    setIsReportDialogOpen(false)
    setReportMotivo('')
    setReportDescripcion('')
  }

  const handleRating = (rating: number) => {
    setUserRating(rating)
    toast.success(`Has calificado "${contenido.titulo}" con ${rating} estrellas`)
    setIsRatingDialogOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav
        perfil={mockPerfiles[0]}
        perfiles={mockPerfiles}
        onLogout={() => router.push('/login')}
      />

      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px]">
        <div className="absolute inset-0">
          <Image
            src={contenido.banner_url || contenido.poster_url}
            alt={contenido.titulo}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative h-full container mx-auto px-4 md:px-12 flex items-end pb-16">
          <div className="max-w-3xl space-y-6">
            {/* Badges */}
            <div className="flex items-center gap-3">
              {contenido.es_original && (
                <Badge className="bg-primary text-primary-foreground">
                  ORIGINAL QUINDIOFLIX
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance">
              {contenido.titulo}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {contenido.calificacion_promedio && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="h-4 w-4 fill-current" />
                  {contenido.calificacion_promedio.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {contenido.año}
              </span>
              {contenido.duracion_minutos && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {esSerie 
                    ? `${contenido.duracion_minutos} min/ep`
                    : `${Math.floor(contenido.duracion_minutos / 60)}h ${contenido.duracion_minutos % 60}min`
                  }
                </span>
              )}
              <Badge variant="outline" className="border-foreground/30">
                {contenido.clasificacion_edad}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {contenido.categoria}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/90 font-semibold"
                asChild
              >
                <Link href={`/ver/${contenido.id}`}>
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Reproducir
                </Link>
              </Button>

              <Button
                size="lg"
                variant="secondary"
                className="bg-white/20 hover:bg-white/30"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                {isFavorite ? (
                  <Check className="mr-2 h-5 w-5 text-green-400" />
                ) : (
                  <Plus className="mr-2 h-5 w-5" />
                )}
                Mi lista
              </Button>

              <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="outline" className="h-12 w-12 rounded-full">
                    <ThumbsUp className={cn('h-5 w-5', userRating && 'fill-current text-green-400')} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card">
                  <DialogHeader>
                    <DialogTitle>Calificar &quot;{contenido.titulo}&quot;</DialogTitle>
                  </DialogHeader>
                  <div className="py-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Selecciona tu calificación (solo disponible si has visto al menos el 50% del contenido)
                    </p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => handleRating(rating)}
                          className="p-2 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={cn(
                              'h-8 w-8 transition-colors',
                              (userRating && rating <= userRating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground hover:text-yellow-400'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                size="icon"
                variant="outline"
                className="h-12 w-12 rounded-full"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  toast.success('Enlace copiado al portapapeles')
                }}
              >
                <Share2 className="h-5 w-5" />
              </Button>

              <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="outline" className="h-12 w-12 rounded-full">
                    <Flag className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card">
                  <DialogHeader>
                    <DialogTitle>Reportar contenido</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Motivo del reporte</Label>
                      <RadioGroup value={reportMotivo} onValueChange={setReportMotivo}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="contenido_inapropiado" id="r1" />
                          <Label htmlFor="r1" className="cursor-pointer">Contenido inapropiado</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="error_tecnico" id="r2" />
                          <Label htmlFor="r2" className="cursor-pointer">Error técnico</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="derechos_autor" id="r3" />
                          <Label htmlFor="r3" className="cursor-pointer">Derechos de autor</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="otro" id="r4" />
                          <Label htmlFor="r4" className="cursor-pointer">Otro</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción (opcional)</Label>
                      <Textarea
                        placeholder="Describe el problema..."
                        value={reportDescripcion}
                        onChange={(e) => setReportDescripcion(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleReport} className="w-full">
                      Enviar reporte
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Synopsis */}
            <p className="text-foreground/80 max-w-2xl">
              {contenido.sinopsis}
            </p>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {contenido.generos.map((genero) => (
                <Link
                  key={genero.id}
                  href={`/genero/${genero.id}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {genero.nombre}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-4 md:px-12 py-8">
        {esSerie && temporadas.length > 0 ? (
          <Tabs defaultValue="episodios" className="space-y-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="episodios">Episodios</TabsTrigger>
              <TabsTrigger value="relacionados">Títulos similares</TabsTrigger>
              <TabsTrigger value="detalles">Detalles</TabsTrigger>
            </TabsList>

            <TabsContent value="episodios" className="space-y-6">
              {/* Season Selector */}
              {temporadas.length > 1 && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Temporada:</span>
                  <select
                    value={selectedTemporada || ''}
                    onChange={(e) => setSelectedTemporada(Number(e.target.value))}
                    className="bg-secondary border border-border rounded-md px-3 py-2"
                  >
                    {temporadas.map((t) => (
                      <option key={t.id} value={t.id}>
                        Temporada {t.numero}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Episodes List */}
              <div className="space-y-4">
                {temporadaActual?.episodios.map((episodio) => (
                  <Link
                    key={episodio.id}
                    href={`/ver/${contenido.id}?ep=${episodio.id}`}
                    className="flex gap-4 p-4 rounded-lg bg-card hover:bg-card-hover transition-colors group"
                  >
                    <div className="relative w-40 aspect-video rounded overflow-hidden shrink-0">
                      <Image
                        src={episodio.thumbnail_url || contenido.poster_url}
                        alt={episodio.titulo}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-8 w-8 fill-current" />
                      </div>
                    </div>
                    <div className="flex-1 py-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          {episodio.numero}. {episodio.titulo}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {episodio.duracion_minutos} min
                        </span>
                      </div>
                      {episodio.sinopsis && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {episodio.sinopsis}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="relacionados">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {relacionados.map((item) => (
                  <Link
                    key={item.id}
                    href={`/contenido/${item.id}`}
                    className="group"
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2">
                      <Image
                        src={item.poster_url}
                        alt={item.titulo}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h4 className="text-sm font-medium truncate">{item.titulo}</h4>
                  </Link>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="detalles">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Información</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Año</dt>
                      <dd>{contenido.año}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Categoría</dt>
                      <dd className="capitalize">{contenido.categoria}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Clasificación</dt>
                      <dd>{contenido.clasificacion_edad}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Temporadas</dt>
                      <dd>{temporadas.length}</dd>
                    </div>
                    {contenido.total_reproducciones && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Reproducciones</dt>
                        <dd>{contenido.total_reproducciones.toLocaleString()}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Géneros</h3>
                  <div className="flex flex-wrap gap-2">
                    {contenido.generos.map((g) => (
                      <Badge key={g.id} variant="secondary">{g.nombre}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-8">
            <ContentCarousel
              title="Títulos similares"
              contenido={relacionados}
            />
          </div>
        )}
      </section>
    </div>
  )
}
