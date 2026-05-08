'use client';

import Link from 'next/link';
import {
  BarChart3,
  Users,
  FileText,
  AlertCircle,
  Settings,
  Database,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const adminModules = [
    {
      icon: BarChart3,
      title: 'Reportes y Analítica',
      description: 'Dashboards con PIVOT, ROLLUP, CUBE y vistas materializadas',
      href: '/reportes',
      color: 'text-blue-500',
      bg: 'bg-blue-500/20',
    },
    {
      icon: AlertCircle,
      title: 'Panel de Moderación',
      description: 'Revisa y resuelve reportes de contenido inapropiado',
      href: '/moderacion',
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/20',
    },
    {
      icon: FileText,
      title: 'Gestión de Catálogo',
      description: 'CRUD de contenido, temporadas y episodios',
      href: '/catalogo',
      color: 'text-purple-500',
      bg: 'bg-purple-500/20',
    },
    {
      icon: Users,
      title: 'Gestión de Usuarios',
      description: 'Administra usuarios, planes y suscripciones',
      href: '/usuarios',
      color: 'text-green-500',
      bg: 'bg-green-500/20',
    },
    {
      icon: Activity,
      title: 'Monitor de Transacciones',
      description: 'Estado de transacciones activas y concurrencia',
      href: '/transacciones',
      color: 'text-pink-500',
      bg: 'bg-pink-500/20',
    },
    {
      icon: Database,
      title: 'Herramientas DBA',
      description: 'Índices, vistas materializadas, fragmentación',
      href: '/dba',
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/20',
    },
  ];

  const stats = [
    { label: 'Usuarios activos', value: '24,580', icon: Users },
    { label: 'Ingresos mensuales', value: '$245,980', icon: TrendingUp },
    { label: 'Reportes pendientes', value: '12', icon: AlertCircle },
    { label: 'Contenido en catálogo', value: '487', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Bienvenido al centro de control de QuindioFlix. Gestiona usuarios, contenido, reportes
            y analítica.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Admin Modules */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Módulos de administración</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminModules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group bg-card border border-border rounded-lg p-6 hover:border-accent transition-all hover:shadow-lg"
                >
                  <div className={`p-3 rounded-lg ${module.bg} w-fit mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${module.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors mb-2">
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Acceder
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Features Grid */}
        <div className="bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Características principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full" />
                Análisis avanzado
              </h3>
              <p className="text-sm text-muted-foreground">
                Accede a reportes con PIVOT, ROLLUP, CUBE y vistas materializadas de Oracle para
                análisis profundo de consumo y ingresos.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full" />
                Moderación eficiente
              </h3>
              <p className="text-sm text-muted-foreground">
                Cola de reportes con filtros, estadísticas y comentarios para una moderación
                rápida y efectiva.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full" />
                Gestión de contenido
              </h3>
              <p className="text-sm text-muted-foreground">
                CRUD completo de películas, series, documentales, música y podcasts con
                temporadas y episodios.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full" />
                Control total
              </h3>
              <p className="text-sm text-muted-foreground">
                Herramientas DBA para monitorear transacciones, índices y vistas materializadas
                de Oracle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
