'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Heart,
  History,
  CreditCard,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import type { Perfil } from '@/lib/types'

interface MainNavProps {
  perfil?: Perfil | null
  perfiles?: Perfil[]
  onPerfilChange?: (perfil: Perfil) => void
  onLogout?: () => void
}

const navLinks = [
  { href: '/inicio', label: 'Inicio' },
  { href: '/series', label: 'Series' },
  { href: '/peliculas', label: 'Peliculas' },
  { href: '/documentales', label: 'Documentales' },
  { href: '/musica', label: 'Musica' },
  { href: '/podcasts', label: 'Podcasts' },
  { href: '/mi-lista', label: 'Mi Lista' },
]

export function MainNav({
  perfil,
  perfiles = [],
  onPerfilChange,
  onLogout,
}: MainNavProps) {
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/buscar?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background/95 via-background/80 to-transparent backdrop-blur-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/inicio" className="shrink-0">
            <Logo size="md" />
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  pathname === link.href
                    ? 'text-foreground bg-secondary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <Input
                    type="search"
                    placeholder="Buscar titulos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 md:w-64 h-9 bg-secondary/80 border-border"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-1"
                    onClick={() => {
                      setIsSearchOpen(false)
                      setSearchQuery('')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
            </Button>

            {perfil && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2"
                  >
                    <Avatar className="h-8 w-8 rounded">
                      <AvatarImage src={perfil.avatar} alt={perfil.nombre} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {perfil.nombre.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-card border-border"
                >
                  {perfiles.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Cambiar perfil
                      </div>
                      {perfiles.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={() => onPerfilChange?.(p)}
                          className={cn(
                            'cursor-pointer',
                            p.id === perfil.id && 'bg-secondary'
                          )}
                        >
                          <Avatar className="h-6 w-6 mr-2 rounded">
                            <AvatarImage src={p.avatar} alt={p.nombre} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {p.nombre.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{p.nombre}</span>
                          {p.es_infantil && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              Infantil
                            </span>
                          )}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem asChild>
                    <Link href="/mi-cuenta" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Mi cuenta
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/mi-cuenta/perfiles" className="cursor-pointer">
                      <Heart className="h-4 w-4 mr-2" />
                      Mis perfiles
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/mi-cuenta/historial" className="cursor-pointer">
                      <History className="h-4 w-4 mr-2" />
                      Historial
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/mi-cuenta/pagos" className="cursor-pointer">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pagos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/mi-cuenta" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Configuracion
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Shield className="h-4 w-4 mr-2" />
                      Panel Admin
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={onLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-border pt-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    pathname === link.href
                      ? 'text-foreground bg-secondary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
