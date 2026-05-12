'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle2, Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { dbaAPI } from '@/lib/api';

export default function DBAPage() {
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vistas, setVistas] = useState<any[]>([]);
  const [tablespaces, setTablespaces] = useState<any[]>([]);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      const vistasData = await dbaAPI.vistasMaterializadas()
      if (vistasData && Array.isArray(vistasData)) setVistas(vistasData)

      const tsData = await dbaAPI.tablespaces()
      if (tsData && Array.isArray(tsData)) setTablespaces(tsData)
    } catch {
      console.warn('API no disponible')
      setVistas([
        { nombre: 'V_CONSUMO_POR_CIUDAD', descripcion: 'Consumo de contenido agrupado por ciudad y plan', ultimo_refresh: new Date().toISOString(), estado: 'ACTUALIZADA', filas: 145680 },
        { nombre: 'V_INGRESOS_MENSUALES', descripcion: 'Ingresos totales por mes y por plan', ultimo_refresh: new Date().toISOString(), estado: 'ACTUALIZADA', filas: 60 },
      ])
      setTablespaces([
        { nombre: 'QUINDIOFLIX_DATA', tipo: 'PERMANENTE', tamaño_bytes: 1288490188, usado_bytes: 918734848, disponible_bytes: 389755340, porcentaje_uso: 71 },
        { nombre: 'QUINDIOFLIX_TEMP', tipo: 'TEMPORAL', tamaño_bytes: 536870912, usado_bytes: 134217728, disponible_bytes: 402653184, porcentaje_uso: 25 },
      ])
    } finally {
      setIsLoading(false)
    }
  };

  useEffect(() => {
    cargarDatos()
  }, [])

  const refreshVistasMaterializadas = async (vista: string) => {
    setRefreshing(vista);
    try {
      await dbaAPI.refrescarVista(vista);
      toast.success(`Vista ${vista} refrescada correctamente`);
      cargarDatos();
    } catch {
      toast.error('Error al refrescar la vista');
    } finally {
      setRefreshing(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Herramientas DBA</h1>
          <p className="text-muted-foreground">
            Administra índices, vistas materializadas, transacciones y tablespaces de Oracle
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <>
            {/* Vistas Materializadas */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Database className="w-6 h-6" />
                Vistas Materializadas
              </h2>

              <div className="space-y-4">
                {vistas.map((vista) => (
                  <div key={vista.nombre} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground">{vista.nombre}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{vista.descripcion || '-'}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-green-500 text-sm font-semibold mb-2">
                          <CheckCircle2 className="w-4 h-4" />
                          {vista.estado || 'ACTUALIZADA'}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => refreshVistasMaterializadas(vista.nombre)}
                          disabled={refreshing === vista.nombre}
                          className="gap-2"
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshing === vista.nombre ? 'animate-spin' : ''}`} />
                          {refreshing === vista.nombre ? 'Refrescando...' : 'Refrescar'}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Filas</p>
                        <p className="font-semibold text-foreground">{(vista.filas || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ultimo refresh</p>
                        <p className="font-semibold text-foreground text-xs">
                          {vista.ultimo_refresh ? new Date(vista.ultimo_refresh).toLocaleString('es-CO') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Espacio estimado</p>
                        <p className="font-semibold text-foreground">~{Math.round((vista.filas || 0) / 1000)} MB</p>
                      </div>
                    </div>
                  </div>
                ))}
                {vistas.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">No hay vistas materializadas disponibles</p>
                )}
              </div>
        </div>

            {/* Tablespaces */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Gestion de Tablespaces</h2>

              <div className="space-y-6">
                {tablespaces.map((ts) => {
                  const porcentaje = ts.porcentaje_uso || 0
                  const total = ts.tamaño_bytes || 0
                  const usado = ts.usado_bytes || 0
                  const disponible = ts.disponible_bytes || 0
                  return (
                    <div key={ts.nombre} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-foreground">{ts.nombre}</h3>
                        <span className="text-sm font-semibold text-muted-foreground">{ts.tipo || 'PERMANENTE'}</span>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <span>
                            {formatBytes(usado)} / {formatBytes(total)} usado
                          </span>
                          <span>{porcentaje}%</span>
                        </div>
                        <div className="w-full h-3 bg-card rounded-full overflow-hidden">
                          <div
                            className={`h-full ${porcentaje > 80 ? 'bg-red-500' : 'bg-accent'}`}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Disponible: {formatBytes(disponible)}
                        </p>
                      </div>

                      {porcentaje > 80 && (
                        <div className="flex gap-2 items-start text-sm text-yellow-500 bg-yellow-500/10 p-2 rounded">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>Espacio bajo. Considera hacer un resize o limpieza.</span>
                        </div>
                      )}
                    </div>
                  )
                })}
                {tablespaces.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">No hay tablespaces disponibles</p>
                )}
              </div>
        </div>
          </>
        )}

        {/* Herramientas adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button variant="outline" className="h-12 text-base justify-start">
            EXPLAIN PLAN de Queries
          </Button>
          <Button variant="outline" className="h-12 text-base justify-start">
            Monitor de Locks
          </Button>
          <Button variant="outline" className="h-12 text-base justify-start">
            Estadísticas de Tablas
          </Button>
          <Button variant="outline" className="h-12 text-base justify-start">
            Backup y Recovery
          </Button>
        </div>
      </div>
    </div>
  );
}
