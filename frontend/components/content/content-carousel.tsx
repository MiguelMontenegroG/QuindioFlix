'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ContentCard } from './content-card'
import type { Contenido } from '@/lib/types'

interface ContentCarouselProps {
  title: string
  contenido: Contenido[]
  variant?: 'default' | 'wide'
  showAllLink?: string
  favoritos?: number[]
  onFavoriteToggle?: (id: number) => void
  className?: string
}

export function ContentCarousel({
  title,
  contenido,
  variant = 'default',
  showAllLink,
  favoritos = [],
  onFavoriteToggle,
  className,
}: ContentCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const cardWidth = variant === 'wide' ? 400 : 180
  const gap = 16

  const updateScrollButtons = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = (cardWidth + gap) * 3
    const newScrollLeft =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    })
  }

  if (contenido.length === 0) return null

  return (
    <section className={cn('relative group/carousel', className)}>
      <div className="flex items-center justify-between mb-4 px-4 md:px-12">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          {title}
        </h2>
        {showAllLink && (
          <a
            href={showAllLink}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Ver todo
          </a>
        )}
      </div>

      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full w-12',
            'bg-gradient-to-r from-background via-background/80 to-transparent',
            'rounded-none opacity-0 group-hover/carousel:opacity-100 transition-opacity',
            !canScrollLeft && 'hidden'
          )}
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto px-4 md:px-12 pb-4"
          onScroll={updateScrollButtons}
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {contenido.map((item) => (
            <div
              key={item.id}
              className="shrink-0"
              style={{
                width: variant === 'wide' ? '400px' : '180px',
                scrollSnapAlign: 'start',
              }}
            >
              <ContentCard
                contenido={item}
                variant={variant === 'wide' ? 'wide' : 'default'}
                isFavorite={favoritos.includes(item.id)}
                onFavoriteToggle={onFavoriteToggle}
              />
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full w-12',
            'bg-gradient-to-l from-background via-background/80 to-transparent',
            'rounded-none opacity-0 group-hover/carousel:opacity-100 transition-opacity',
            !canScrollRight && 'hidden'
          )}
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>
    </section>
  )
}
