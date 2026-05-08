'use client';

import { useState } from 'react';
import { BarChart3, Users, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const kpis = [
    {
      icon: Users,
      label: 'Usuarios activos',
      value: '24,580',
      change: '+12.5%',
      color: 'text-blue-500',
      bg: 'bg-blue-500/20',
    },
    {
      icon: DollarSign,
      label: 'Ingresos del mes',
      value: '$245,980',
      change: '+8.2%',
      color: 'text-green-500',
      bg: 'bg-green-500/20',
    },
    {
      icon: TrendingUp,
      label: 'Reproducciones',
      value: '1,245,680',
      change: '+23.1%',
      color: 'text-accent',
      bg: 'bg-accent/20',
    },
    {
      icon: BarChart3,
      label: 'Contenido popular',
      value: '487',
      change: '+5.3%',
      color: 'text-purple-500',
      bg: 'bg-purple-500/20',
    },
  ];

  const cityData = [
    { city: 'Medellín', basico: 450, estandar: 890, premium: 1200, total: 2540 },
    { city: 'Bogotá', basico: 380, estandar: 920, premium: 1450, total: 2750 },
    { city: 'Cali', basico: 320, estandar: 710, premium: 980, total: 2010 },
    { city: 'Armenia', basico: 120, estandar: 345, premium: 560, total: 1025 },
    { city: 'Barranquilla', basico: 290, estandar: 620, premium: 890, total: 1800 },
  ];

  const deviceData = [
    { device: 'Web', mobile: 45000, tablet: 28000, tv: 12000 },
    { device: 'Películas', mobile: 52000, tablet: 31000, tv: 18000 },
    { device: 'Series', mobile: 48000, tablet: 29000, tv: 15000 },
    { device: 'Documentales', mobile: 38000, tablet: 22000, tv: 9000 },
  ];

  const topContent = [
    { titulo: 'Película Acción Extrema', reproducciones: 45680, calificacion: 4.8 },
    { titulo: 'Serie Drama Premium', reproducciones: 38920, calificacion: 4.6 },
    { titulo: 'Documental Naturaleza', reproducciones: 32150, calificacion: 4.9 },
    { titulo: 'Podcast Conversaciones', reproducciones: 28900, calificacion: 4.7 },
    { titulo: 'Música Romántica', reproducciones: 24560, calificacion: 4.5 },
  ];

  const monthlyRevenue = [
    { month: 'Enero', revenue: '$185,200' },
    { month: 'Febrero', revenue: '$192,500' },
    { month: 'Marzo', revenue: '$205,800' },
    { month: 'Abril', revenue: '$215,300' },
    { month: 'Mayo', revenue: '$245,980' },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Reportes y Analítica</h1>
            <p className="text-muted-foreground">Dashboard ejecutivo con datos en tiempo real</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('week')}
            >
              Semana
            </Button>
            <Button
              variant={selectedPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('month')}
            >
              Mes
            </Button>
            <Button
              variant={selectedPeriod === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('year')}
            >
              Año
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${kpi.bg}`}>
                    <Icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                  <span className="text-xs font-semibold text-green-500">{kpi.change}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              </div>
            );
          })}
        </div>

        {/* Consumo por ciudad */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-6">Consumo por ciudad</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Ciudad</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Básico</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Estándar</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Premium</th>
                  <th className="px-4 py-3 text-right font-semibold text-accent">Total</th>
                </tr>
              </thead>
              <tbody>
                {cityData.map((row) => (
                  <tr key={row.city} className="border-b border-border hover:bg-card/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{row.city}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.basico}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.estandar}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.premium}</td>
                    <td className="px-4 py-3 text-right font-semibold text-accent">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Reproducciones por dispositivo */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Reproducciones por dispositivo</h2>
            <div className="space-y-4">
              {deviceData.map((row) => (
                <div key={row.device}>
                  <p className="text-sm font-semibold text-foreground mb-2">{row.device}</p>
                  <div className="flex gap-2 h-6">
                    <div
                      className="bg-blue-500 rounded"
                      style={{ width: `${(row.mobile / 55000) * 100}%` }}
                      title={`Mobile: ${row.mobile}`}
                    />
                    <div
                      className="bg-purple-500 rounded"
                      style={{ width: `${(row.tablet / 35000) * 100}%` }}
                      title={`Tablet: ${row.tablet}`}
                    />
                    <div
                      className="bg-accent rounded"
                      style={{ width: `${(row.tv / 20000) * 100}%` }}
                      title={`TV: ${row.tv}`}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                    <span>📱 {row.mobile}</span>
                    <span>📱 {row.tablet}</span>
                    <span>📺 {row.tv}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contenido Top */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Contenido más popular</h2>
            <div className="space-y-4">
              {topContent.map((content, i) => (
                <div key={i} className="border-b border-border pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">{content.titulo}</h3>
                    <span className="text-xs font-semibold text-accent">⭐ {content.calificacion}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {content.reproducciones.toLocaleString()} reproducciones
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ingresos mensuales */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-6">Ingresos mensuales</h2>
          <div className="space-y-4">
            {monthlyRevenue.map((row) => (
              <div key={row.month} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{row.month}</span>
                <div className="flex-1 mx-4 h-2 bg-card/50 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: '85%' }} />
                </div>
                <span className="text-sm font-semibold text-accent">{row.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="flex gap-3">
          <Button className="gap-2">
            📊 Exportar PDF
          </Button>
          <Button variant="outline" className="gap-2">
            📋 Exportar CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
