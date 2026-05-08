import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        className={cn(sizes[size], 'text-primary')}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Icono de play estilizado con Q */}
        <rect
          x="2"
          y="2"
          width="36"
          height="36"
          rx="8"
          fill="currentColor"
        />
        <path
          d="M16 12L28 20L16 28V12Z"
          fill="white"
        />
        <circle
          cx="28"
          cy="28"
          r="6"
          fill="currentColor"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M30 30L34 34"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span className={cn('font-bold tracking-tight', textSizes[size])}>
          <span className="text-foreground">Quindio</span>
          <span className="text-primary">Flix</span>
        </span>
      )}
    </div>
  )
}
