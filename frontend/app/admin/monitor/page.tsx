'use client';

import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, Film, PlayCircle, DollarSign,
  TrendingUp, AlertTriangle, Activity,
  CreditCard, Clock, UserPlus, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Colores para graficos
const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

// ==================== TIPOS ====================
interface DBStats {
  total_usuarios: number;
  usuarios_activos: number;
  usuarios_inactivos: number;
  total_contenido: number;
  total_reproducciones: number;
  total_pagos: number;
  ingresos_mes: number;
  reproducciones_hoy: number;
  usuarios_nuevos_hoy: number;
  pagos_pendientes: number;
  timestamp: string;
  planes: { nombre: string; total: number }[];
  top_contenido: { titulo: string; vistas: number }[];
  top_calificado: { titulo: string; promedio: number; votos: number }[];
}

interface ActivityData {
  ultimos_usuarios: { ID_USUARIO: number; NOMBRE: string; EMAIL: string; FECHA: string }[];
  ultimas_reproducciones: { ID_REPRODUCCION: number; TITULO: string; FECHA: string }[];
  ultimos_pagos: { ID_PAGO: number; NOMBRE: number; MONTO: number; ESTADO_PAGO: string; FECHA: string }[];
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function MonitorPage() {
  const [stats, setStats] = useState<DBStats | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyStats, setHistoryStats] = useState<DBStats[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = `${API_BASE_URL}/monitor/stream`;
    const es = new EventSource(url);

    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    es.addEventListener('stats', (event) => {
      try {
        const data = JSON.parse(event.data) as DBStats;
        setStats(data);
        setHistoryStats((prev) => {
          const next = [...prev, data];
          if (next.length > 60) next.shift();
          return next;
        });
      } catch {
        // ignorar datos corruptos
      }
    });

    es.addEventListener('activity', (event) => {
      try {
        const data = JSON.parse(event.data) as ActivityData;
        setActivity(data);
      } catch {
        // ignorar datos corruptos
      }
    });

    es.addEventListener('error', (event) => {
      try {
        const data = JSON.parse((event as any).data);
        setError(data.mensaje);
      } catch {
        // evento de error sin datos, probablemente reconexion
      }
    });

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  // Metricas derivadas para grafico historico de usuarios
  const usuarioHistory = historyStats.map((s, i) => ({
    time: new Date(s.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    activos: s.usuarios_activos,
    total: s.total_usuarios,
  }));

  // Preparar datos para grafico de planes
  const planesData = stats?.planes.map((p) => ({
    name: p.nombre,
    value: p.total,
  })) || [];

  // Preparar top contenido
  const topContenidoData = stats?.top_contenido.map((c) => ({
    name: c.titulo.length > 20 ? c.titulo.substring(0, 20) + '...' : c.titulo,
    vistas: c.vistas,
  })) || [];

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header con estado de conexion */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Monitor en Vivo</h1>
            <p className="text-gray-400 mt-1">Base de datos Oracle - QuindioFlix</p>
          </div>
          <div className="flex items-center gap-3">
            {connected ? (
              <Badge variant="default" className="bg-green-600 text-white gap-1.5 px-3 py-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1.5 px-3 py-1.5">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                Desconectado
              </Badge>
            )}
            {stats && (
              <span className="text-xs text-gray-500">
                Ultima actualizacion: {new Date(stats.timestamp).toLocaleTimeString('es-CO')}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Tarjetas de metricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={<Users className="w-5 h-5 text-purple-400" />}
            title="Usuarios"
            value={stats?.total_usuarios}
            subtitle={`${stats?.usuarios_activos || 0} activos`}
            loading={!stats}
            color="purple"
          />
          <MetricCard
            icon={<UserPlus className="w-5 h-5 text-blue-400" />}
            title="Nuevos Hoy"
            value={stats?.usuarios_nuevos_hoy}
            subtitle="registros del dia"
            loading={!stats}
            color="blue"
          />
          <MetricCard
            icon={<Film className="w-5 h-5 text-emerald-400" />}
            title="Contenido"
            value={stats?.total_contenido}
            subtitle="peliculas y series"
            loading={!stats}
            color="emerald"
          />
          <MetricCard
            icon={<PlayCircle className="w-5 h-5 text-amber-400" />}
            title="Reproducciones"
            value={stats?.total_reproducciones}
            subtitle={`${stats?.reproducciones_hoy || 0} hoy`}
            loading={!stats}
            color="amber"
          />
          <MetricCard
            icon={<DollarSign className="w-5 h-5 text-green-400" />}
            title="Ingresos del Mes"
            value={stats?.ingresos_mes !== undefined ? `$${(stats.ingresos_mes).toLocaleString('es-CO', { minimumFractionDigits: 0 })}` : undefined}
            subtitle="COP"
            loading={!stats}
            color="green"
          />
          <MetricCard
            icon={<CreditCard className="w-5 h-5 text-rose-400" />}
            title="Pagos Pendientes"
            value={stats?.pagos_pendientes}
            subtitle="por cobrar"
            loading={!stats}
            color="rose"
          />
          <MetricCard
            icon={<Activity className="w-5 h-5 text-cyan-400" />}
            title="Total Pagos"
            value={stats?.total_pagos}
            subtitle="transacciones"
            loading={!stats}
            color="cyan"
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5 text-violet-400" />}
            title="Reproducciones Hoy"
            value={stats?.reproducciones_hoy}
            subtitle="en las ultimas 24h"
            loading={!stats}
            color="violet"
          />
        </div>

        {/* Graficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Grafico de distribucion de planes */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Distribucion de Planes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats && planesData.length > 0 ? (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={planesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {planesData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Skeleton className="h-[300px] bg-zinc-800" />
              )}
            </CardContent>
          </Card>

          {/* Grafico de contenido mas visto */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Top 5 Contenido Mas Visto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats && topContenidoData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topContenidoData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" stroke="#71717a" />
                    <YAxis type="category" dataKey="name" stroke="#71717a" width={120} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="vistas" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="h-[300px] bg-zinc-800" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actividad reciente en tiempo real */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Ultimos usuarios registrados */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <UserPlus className="w-4 h-4 text-blue-400" />
                Ultimos Registros
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity ? (
                <div className="space-y-3">
                  {activity.ultimos_usuarios.map((u) => (
                    <div key={u.ID_USUARIO} className="flex items-center justify-between border-b border-zinc-800 pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white">{u.NOMBRE}</p>
                        <p className="text-xs text-gray-500">{u.EMAIL}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(u.FECHA).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {activity.ultimos_usuarios.length === 0 && (
                    <p className="text-sm text-gray-500 text-center">Sin registros recientes</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 bg-zinc-800" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ultimas reproducciones */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <PlayCircle className="w-4 h-4 text-emerald-400" />
                Reproducciones Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity ? (
                <div className="space-y-3">
                  {activity.ultimas_reproducciones.map((r) => (
                    <div key={r.ID_REPRODUCCION} className="flex items-center justify-between border-b border-zinc-800 pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white">{r.TITULO}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(r.FECHA).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {activity.ultimas_reproducciones.length === 0 && (
                    <p className="text-sm text-gray-500 text-center">Sin reproducciones recientes</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 bg-zinc-800" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ultimos pagos */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <CreditCard className="w-4 h-4 text-amber-400" />
                Ultimos Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity ? (
                <div className="space-y-3">
                  {activity.ultimos_pagos.map((p) => (
                    <div key={p.ID_PAGO} className="flex items-center justify-between border-b border-zinc-800 pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white">{p.NOMBRE}</p>
                        <p className="text-xs text-gray-500">
                          ${p.MONTO?.toLocaleString('es-CO')} COP
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={p.ESTADO_PAGO === 'EXITOSO' ? 'default' : 'secondary'}
                          className={p.ESTADO_PAGO === 'EXITOSO' ? 'bg-green-700 text-white' : 'bg-yellow-700 text-white'}>
                          {p.ESTADO_PAGO}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(p.FECHA).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activity.ultimos_pagos.length === 0 && (
                    <p className="text-sm text-gray-500 text-center">Sin pagos recientes</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 bg-zinc-800" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline en tiempo real */}
        <Card className="bg-zinc-900 border-zinc-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Evolucion de Usuarios en Vivo
              <span className="text-xs text-gray-500 font-normal">
                (ultimos 60 puntos ~ 3 minutos)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usuarioHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={usuarioHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="activos" name="Activos" fill="#10B981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-500">
                <Clock className="w-5 h-5 mr-2 animate-pulse" />
                Acumulando datos en vivo...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel de contenido mejor calificado */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Contenido Mejor Calificado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.top_calificado && stats.top_calificado.length > 0 ? (
              <div className="space-y-4">
                {stats.top_calificado.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? "bg-yellow-500/20 text-yellow-400" :
                        index === 1 ? "bg-gray-400/20 text-gray-300" :
                        index === 2 ? "bg-amber-700/20 text-amber-500" :
                        "bg-zinc-700/50 text-zinc-400"
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{item.titulo}</p>
                        <p className="text-xs text-gray-500">{item.votos} {item.votos === 1 ? 'voto' : 'votos'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-bold text-yellow-400">{item.promedio.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                <Star className="w-5 h-5 mr-2" />
                {stats ? 'Sin datos de calificaciones disponibles' : 'Cargando datos...'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==================== COMPONENTE MetricCard ====================
function MetricCard({
  icon,
  title,
  value,
  subtitle,
  loading,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string | number;
  subtitle?: string;
  loading: boolean;
  color?: string;
}) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <p className="text-sm text-gray-400">{title}</p>
          </div>
        </div>
        <div className="mt-2">
          {loading ? (
            <Skeleton className="h-8 w-24 bg-zinc-800" />
          ) : (
            <>
              <p className="text-2xl font-bold text-white">
                {value !== undefined ? value : '--'}
              </p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}