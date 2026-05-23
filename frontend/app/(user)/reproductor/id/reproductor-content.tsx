'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  ChevronLeft,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Heart,
  SkipBack,
  SkipForward,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { mockContenido } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

export default function ReproductorContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = Number(params.id)
  const episodioId = searchParams.get('episodio')

  const playerRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [played, setPlayed] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeout = useRef<ReturnType<typeof setTimeout>>()
  const [isFavorite, setIsFavorite] = useState(false)

  const contenido = mockContenido.find((c) => c.id === id)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
      controlsTimeout.current = setTimeout(() => {
        if (playing) setShowControls(false)
      }, 3000)
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    }
  }, [playing])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
      </div>
    )
  }

  if (!contenido) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Contenido no encontrado</h1>
          <Button onClick={() => router.push('/inicio')}>Volver al inicio</Button>
        </div>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played)
    }
  }

  const handleSeekChange = (value: number[]) => {
    setPlayed(value[0])
  }

  const handleSeekMouseUp = (value: number[]) => {
    setSeeking(false)
    playerRef.current?.seekTo(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    setMuted(value[0] === 0)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const skipForward = () => {
    const currentTime = playerRef.current?.getCurrentTime() || 0
    playerRef.current?.seekTo(currentTime + 10)
  }

  const skipBackward = () => {
    const currentTime = playerRef.current?.getCurrentTime() || 0
    playerRef.current?.seekTo(currentTime - 10)
  }

  return (
    <div
      className="min-h-screen bg-black relative flex flex-col"
      onMouseMove={() => {
        setShowControls(true)
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
        controlsTimeout.current = setTimeout(() => {
          if (playing) setShowControls(false)
        }, 3000)
      }}
    >
      {/* Barra superior */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">Volver</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-white font-semibold text-sm">
              {contenido.titulo}
              {episodioId && ` - Episodio ${episodioId}`}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="text-white/70 hover:text-white"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart className={cn('h-5 w-5', isFavorite && 'fill-red-500 text-red-500')} />
            </Button>
          </div>
        </div>
      </div>

      {/* Reproductor */}
      <div className="flex-1 flex items-center justify-center relative bg-black">
        <ReactPlayer
          ref={playerRef}
          url={contenido.trailer_url || 'https://www.w3schools.com/html/mov_bbb.mp4'}
          width="100%"
          height="100%"
          playing={playing}
          muted={muted}
          volume={volume}
          onProgress={handleProgress}
          onDuration={setDuration as any}
          style={{ position: 'absolute', top: 0, left: 0 }}
          config={{}}
        />

        {/* Overlay de play/pausa */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-opacity',
            playing ? 'opacity-0 pointer-events-none' : 'opacity-100 bg-black/40'
          )}
        >
          <button
            onClick={() => setPlaying(!playing)}
            className="w-20 h-20 rounded-full bg-accent/80 flex items-center justify-center hover:bg-accent transition-colors"
          >
            <svg className="w-10 h-10 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </button>
        </div>
      </div>

      {/* Controles inferiores */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Barra de progreso */}
        <div className="mb-4 px-2">
          <Slider
            value={[played]}
            min={0}
            max={1}
            step={0.001}
            onValueChange={handleSeekChange}
            onValueCommit={handleSeekMouseUp}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>{formatTime(played * duration)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Botones de control */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:text-white/80"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="h-6 w-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </Button>

            {/* Skip Backward */}
            <Button
              size="icon"
              variant="ghost"
              className="text-white/70 hover:text-white"
              onClick={skipBackward}
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            {/* Skip Forward */}
            <Button
              size="icon"
              variant="ghost"
              className="text-white/70 hover:text-white"
              onClick={skipForward}
            >
              <SkipForward className="h-5 w-5" />
            </Button>

            {/* Volumen */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="text-white/70 hover:text-white"
                onClick={() => setMuted(!muted)}
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <Slider
                value={[muted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Fullscreen */}
            <Button
              size="icon"
              variant="ghost"
              className="text-white/70 hover:text-white"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
