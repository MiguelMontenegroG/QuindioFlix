'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Check, X, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { reportesContenidoAPI } from '@/lib/api';
import type { Reporte } from '@/lib/types';

export default function ModerationPage() {
  const [reports, setReports] = useState<Reporte[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedReport, setSelectedReport] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);

  const cargarReportes = async () => {
    setIsLoading(true);
    try {
      const response = await reportesContenidoAPI.obtenerTodos();
      if (response?.data) {
        setReports(response.data);
      }
    } catch {
      console.warn('API no disponible');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const filteredReports = reports.filter((r) => {
    if (selectedStatus === 'todos') return true;
    return r.estado === selectedStatus;
  });

  const pendingCount = reports.filter((r) => r.estado === 'pendiente').length;

  const resolveReport = async (id: number, accion: 'resuelto' | 'rechazado') => {
    setIsResolving(true);
    try {
      await reportesContenidoAPI.resolver(id, {
        estado: accion,
        comentario: `Reporte ${accion === 'resuelto' ? 'resuelto' : 'rechazado'} por moderador`,
      });
      toast.success(`Reporte ${accion === 'resuelto' ? 'resuelto' : 'rechazado'} correctamente`);
      setSelectedReport(null);
      cargarReportes();
    } catch {
      toast.error('Error al procesar el reporte');
    } finally {
      setIsResolving(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendiente: 'bg-yellow-500/20 text-yellow-500',
      resuelto: 'bg-green-500/20 text-green-500',
      rechazado: 'bg-red-500/20 text-red-500',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-500';
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      'contenido_inapropiado': 'bg-red-500/20 text-red-500',
      'error_tecnico': 'bg-orange-500/20 text-orange-500',
      'derechos_autor': 'bg-purple-500/20 text-purple-500',
      'otro': 'bg-gray-500/20 text-gray-500',
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
              {reports.filter((r) => r.estado === 'resuelto').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Tasa de resolución</p>
            <p className="text-3xl font-bold text-accent">
              {Math.round(
                (reports.filter((r) => r.estado === 'resuelto').length / (reports.length || 1)) * 100
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
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report: any) => (
              <div
                key={report.id}
                className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors cursor-pointer"
                onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground">
                        Contenido #{report.id_contenido}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(report.estado)}`}>
                        {report.estado === 'pendiente' ? 'Pendiente' : report.estado === 'resuelto' ? 'Resuelto' : 'Rechazado'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Reportado por Perfil #{report.id_perfil} • {report.fecha_creacion ? new Date(report.fecha_creacion).toLocaleDateString('es-CO') : 'Fecha no disponible'}
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
                      <span className="font-semibold text-foreground">Descripcion: </span>
                      {report.descripcion || 'Sin descripcion adicional'}
                    </p>
                    {report.estado === 'pendiente' && (
                      <div className="flex gap-3">
                        <Button
                          onClick={() => resolveReport(report.id, 'resuelto')}
                          disabled={isResolving}
                          className="gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Resolver
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => resolveReport(report.id, 'rechazado')}
                          disabled={isResolving}
                          className="gap-2"
                        >
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
        )}

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
