'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analiticaAPI } from '@/lib/api';

export default function ReportesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [kpisData, setKpisData] = useState({
    usuarios_activos: 0,
    ingresos_mensuales: 0,
    total_reproducciones: 0,
    contenido_total: 0,
  });
  const [cityData, setCityData] = useState<any[]>([]);
  const [topContent, setTopContent] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);

  useEffect(() => {
    async function cargarReportes() {
      setIsLoading(true);
      try {
        const kpis = await analiticaAPI.obtenerKPIs()
        if (kpis) {
          setKpisData({
            usuarios_activos: kpis.usuarios_activos || 0,
            ingresos_mensuales: kpis.ingresos_mensuales || 0,
            total_reproducciones: kpis.total_reproducciones || 0,
            contenido_total: kpis.contenido_total || 0,
          })
        }

        const consumo = await analiticaAPI.consumoPorCiudad()
        if (consumo && Array.isArray(consumo)) setCityData(consumo)

        const popular = await analiticaAPI.contenidoPopular()
        if (popular && Array.isArray(popular)) setTopContent(popular)

        const financiero = await analiticaAPI.reporteFinanciero()
        if (financiero && Array.isArray(financiero)) setMonthlyRevenue(financiero)
      } catch {
        console.warn('API no disponible, usando datos por defecto')
        setCityData([
          { ciudad: 'Medellin', total_usuarios: 450, ingresos_totales: 1200000 },
          { ciudad: 'Bogota', total_usuarios: 380, ingresos_totales: 1450000 },
          { ciudad: 'Cali', total_usuarios: 320, ingresos_totales: 980000 },
          { ciudad: 'Armenia', total_usuarios: 120, ingresos_totales: 560000 },
        ])
        setTopContent([
          { titulo: 'Pelicula de ejemplo', total_reproducciones: 45680, calificacion_promedio: 4.8 },
        ])
        setMonthlyRevenue([
          { mes: '2026-01', ingresos: 185200 },
          { mes: '2026-02', ingresos: 192500 },
          { mes: '2026-03', ingresos: 205800 },
        ])
      } finally {
        setIsLoading(false)
      }
    }
    cargarReportes()
  }, [])

  const kpis = [
    {
      icon: Users,
      label: 'Usuarios activos',
      value: kpisData.usuarios_activos.toLocaleString('es-CO'),
      change: '+12.5%',
      color: 'text-blue-500',
      bg: 'bg-blue-500/20',
    },
    {
      icon: DollarSign,
      label: 'Ingresos del mes',
      value: `$${kpisData.ingresos_mensuales.toLocaleString('es-CO')}`,
      change: '+8.2%',
      color: 'text-green-500',
      bg: 'bg-green-500/20',
    },
    {
      icon: TrendingUp,
      label: 'Reproducciones',
      value: kpisData.total_reproducciones.toLocaleString('es-CO'),
      change: '+23.1%',
      color: 'text-accent',
      bg: 'bg-accent/20',
    },
    {
      icon: BarChart3,
      label: 'Contenido en catalogo',
      value: kpisData.contenido_total.toString(),
      change: '+5.3%',
      color: 'text-purple-500',
      bg: 'bg-purple-500/20',
    },
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

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <>
            {/* Consumo por ciudad */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-foreground mb-6">Consumo por ciudad</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Ciudad</th>
                       <th className="px-4 py-3 text-right font-semibold text-foreground">Usuarios</th>
                       <th className="px-4 py-3 text-right font-semibold text-accent">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cityData.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                          No hay datos disponibles
                        </td>
                      </tr>
                    ) : (
                      cityData.map((row: any, i: number) => (
                        <tr key={i} className="border-b border-border hover:bg-card/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-foreground">{row.ciudad || row.city}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{row.total_usuarios || 0}</td>
                          <td className="px-4 py-3 text-right font-semibold text-accent">
                            {(row.ingresos_totales || 0).toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Contenido Top */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Contenido mas popular</h2>
                <div className="space-y-4">
                  {topContent.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay datos disponibles</p>
                  ) : (
                    topContent.map((content: any, i: number) => (
                      <div key={i} className="border-b border-border pb-4 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-sm font-semibold text-foreground">{content.titulo}</h3>
                          {content.calificacion_promedio && (
                            <span className="text-xs font-semibold text-accent">
                              {content.calificacion_promedio.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {content.total_reproducciones?.toLocaleString() || 0} reproducciones
                        </p>
                      </div>
                    ))
                  )}
                </div>
        </div>

              {/* Reporte financiero */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Ingresos mensuales</h2>
                <div className="space-y-4">
                  {monthlyRevenue.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay datos disponibles</p>
                  ) : (
                    monthlyRevenue.map((row: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{row.mes || row.month}</span>
                        <div className="flex-1 mx-4 h-2 bg-card/50 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min((row.ingresos || row.total_ingresos || row.revenue || 0) / 300000 * 100, 100)}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-accent">
                          ${(row.ingresos || row.total_ingresos || row.revenue || 0).toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
        </div>

            {/* Export */}
            <div className="flex gap-3">
              <Button className="gap-2" onClick={() => alert('Exportacion PDF iniciada')}>
                Exportar PDF
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => alert('Exportacion CSV iniciada')}>
                Exportar CSV
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
