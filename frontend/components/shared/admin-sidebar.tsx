'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Film,
  Users,
  Flag,
  BarChart3,
  Settings,
  Database,
  CreditCard,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Home,
  Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { RolOracle } from '@/lib/types'

interface AdminSidebarProps {
  rol?: RolOracle
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

interface NavSection {
  title: string
  items: {
    href: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    roles?: RolOracle[]
  }[]
}

const navSections: NavSection[] = [
  {
    title: 'General',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Contenido',
    items: [
      { href: '/admin/catalogo', label: 'Catálogo', icon: Film, roles: ['ROL_CONTENIDO', 'ROL_ADMIN'] },
      { href: '/admin/moderacion', label: 'Moderación', icon: Flag, roles: ['ROL_SOPORTE', 'ROL_ADMIN'] },
    ],
  },
  {
    title: 'Usuarios',
    items: [
      { href: '/admin/usuarios', label: 'Usuarios', icon: Users, roles: ['ROL_SOPORTE', 'ROL_ADMIN'] },
      { href: '/admin/pagos', label: 'Pagos', icon: CreditCard, roles: ['ROL_SOPORTE', 'ROL_ADMIN'] },
    ],
  },
  {
    title: 'Analítica',
    items: [
      { href: '/admin/reportes', label: 'Reportes', icon: BarChart3, roles: ['ROL_ANALISTA', 'ROL_ADMIN'] },
    ],
  },
  {
    title: 'Administración',
    items: [
      { href: '/admin/empleados', label: 'Empleados', icon: UserCog, roles: ['ROL_ADMIN'] },
      { href: '/admin/roles', label: 'Terminal Oracle', icon: Shield, roles: ['ROL_ADMIN'] },
      { href: '/admin/planes', label: 'Planes', icon: Settings, roles: ['ROL_ADMIN'] },
    ],
  },
  {
    title: 'Herramientas DBA',
    items: [
      { href: '/admin/transacciones', label: 'Transacciones', icon: Activity, roles: ['ROL_ADMIN'] },
      { href: '/admin/dba', label: 'Herramientas DBA', icon: Database, roles: ['ROL_ADMIN'] },
    ],
  },
  {
    title: 'Monitor',
    items: [
      { href: '/admin/monitor', label: 'BD en Vivo', icon: Monitor },
    ],
  },
]

export function AdminSidebar({
  rol = 'ROL_ADMIN',
  collapsed = false,
  onCollapsedChange,
}: AdminSidebarProps) {
  const pathname = usePathname()

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || item.roles.includes(rol)
      ),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div
            className={cn(
              'flex h-16 items-center border-b border-sidebar-border px-4',
              collapsed ? 'justify-center' : 'justify-between'
            )}
          >
            <Link href="/admin">
              <Logo size="sm" showText={!collapsed} />
            </Link>
            {!collapsed && (
              <span className="text-xs font-medium text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded">
                Admin
              </span>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-6 px-2">
              {filteredSections.map((section) => (
                <div key={section.title}>
                  {!collapsed && (
                    <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.title}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href
                      const Icon = item.icon

                      const linkContent = (
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                            collapsed && 'justify-center px-2'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-5 w-5 shrink-0',
                              isActive && 'text-sidebar-primary'
                            )}
                          />
                          {!collapsed && <span>{item.label}</span>}
                        </Link>
                      )

                      if (collapsed) {
                        return (
                          <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                              {linkContent}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-popover">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        )
                      }

                      return <div key={item.href}>{linkContent}</div>
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-2 space-y-1">
            {/* Volver a la plataforma */}
            {!collapsed && (
              <Link
                href="/inicio"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
              >
                <Home className="h-5 w-5 shrink-0" />
                <span>Volver a QuindioFlix</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-center text-muted-foreground hover:text-foreground',
                !collapsed && 'justify-start'
              )}
              onClick={() => onCollapsedChange?.(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Colapsar
                </>
              )}
            </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
