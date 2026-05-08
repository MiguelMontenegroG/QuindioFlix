'use client';

import { useState } from 'react';
import { AlertCircle, Check, X, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ModerationPage() {
  const [selectedStatus, setSelectedStatus] = useState<'todos' | 'pendiente' | 'resuelto'>('todos');
  const [reports, setReports] = useState([
    {
      id: 1,
      contenido: 'Película: Acción Extrema',
      motivo: 'Contenido violento',
      reportador: 'Usuario #2345',
      fecha: '2024-05-20',
      estado: 'Pendiente',
      descripcion: 'Este contenido contiene escenas de violencia explícita no apropiadas',
    },
    {
      id: 2,
      contenido: 'Serie: Drama Nocturno',
      motivo: 'Lenguaje ofensivo',
      reportador: 'Usuario #5678',
      fecha: '2024-05-19',
      estado: 'Pendiente',
      descripcion: 'Contiene insultos y lenguaje inapropiado',
    },
    {
      id: 3,
      contenido: 'Podcast: Conversación Libre',
      motivo: 'Desinformación',
      reportador: 'Usuario #9012',
      fecha: '2024-05-18',
      estado: 'Resuelto',
      descripcion: 'Información falsa sobre un tema de salud',
    },
  ]);

  const [selectedReport, setSelectedReport] = useState<number | null>(null);

  const filteredReports = reports.filter((r) => {
    if (selectedStatus === 'todos') return true;
    return r.estado.toLowerCase() === selectedStatus;
  });

  const pendingCount = reports.filter((r) => r.estado === 'Pendiente').length;

  const resolveReport = (id: number) => {
    setReports(
      reports.map((r) =>
        r.id === id
          ? { ...r, estado: 'Resuelto' }
          : r
      )
    );
    setSelectedReport(null);
  };

  const getStatusColor = (status: string) => {
    return status === 'Pendiente'
      ? 'bg-yellow-500/20 text-yellow-500'
      : 'bg-green-500/20 text-green-500';
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      'Contenido violento': 'bg-red-500/20 text-red-500',
      'Lenguaje ofensivo': 'bg-orange-500/20 text-orange-500',
      'Desinformación': 'bg-purple-500/20 text-purple-500',
    };
    return colors[reason] || 'bg-gray-500/20 text-gray-500';
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Panel de Moderación</h1>
          <p className="text-muted-foreground">Revisa y resuelve reportes de contenido inapropiado</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Total reportes</p>
            <p className="text-3xl font-bold text-foreground">{reports.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Pendientes</p>
            <p className="text-3xl font-bold text-yellow-500">{pendingCount}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Resueltos</p>
            <p className="text-3xl font-bold text-green-500">
              {reports.filter((r) => r.estado === 'Resuelto').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Tasa de resolución</p>
            <p className="text-3xl font-bold text-accent">
              {Math.round(
                (reports.filter((r) => r.estado === 'Resuelto').length / reports.length) * 100
              )}
              %
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={selectedStatus === 'todos' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('todos')}
          >
            Todos
          </Button>
          <Button
            variant={selectedStatus === 'pendiente' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('pendiente')}
          >
            Pendientes
          </Button>
          <Button
            variant={selectedStatus === 'resuelto' ? 'default' : 'outline'}
            onClick={() => setSelectedStatus('resuelto')}
          >
            Resueltos
          </Button>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors cursor-pointer"
              onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-foreground">{report.contenido}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(report.estado)}`}>
                      {report.estado}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reportado por {report.reportador} • {report.fecha}
                  </p>
                </div>
                <Eye className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getReasonColor(report.motivo)}`}>
                  {report.motivo}
                </span>
              </div>

              {selectedReport === report.id && (
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    <span className="font-semibold text-foreground">Descripción: </span>
                    {report.descripcion}
                  </p>
                  {report.estado === 'Pendiente' && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => resolveReport(report.id)}
                        className="gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Resolver
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <X className="w-4 h-4" />
                        Rechazar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 bg-card border border-border rounded-lg">
            <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {selectedStatus === 'todos' ? 'Sin reportes' : 'Sin reportes en esta categoría'}
            </h2>
            <p className="text-muted-foreground">¡Excelente trabajo! No hay reportes pendientes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
