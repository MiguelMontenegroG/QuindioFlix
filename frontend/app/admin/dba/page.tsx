'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle2, Database, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { dbaAPI } from '@/lib/api';

export default function DBAPage() {
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistas, setVistas] = useState<any[]>([]);
  const [tablespaces, setTablespaces] = useState<any[]>([]);

  const cargarDatos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vistasData, tsData] = await Promise.all([
        dbaAPI.vistasMaterializadas().catch(() => null),
        dbaAPI.tablespaces().catch(() => null),
      ])

      if (vistasData && Array.isArray(vistasData) && vistasData.length > 0) {
        setVistas(vistasData)
      } else {
        setVistas([])
      }

      if (tsData && Array.isArray(tsData) && tsData.length > 0) {
        setTablespaces(tsData)
      } else {
        setTablespaces([])
      }

      if ((!vistasData || !Array.isArray(vistasData) || vistasData.length === 0) &&
          (!tsData || !Array.isArray(tsData) || tsData.length === 0)) {
        setError('No se pudieron obtener datos. Verifique la conexion a la base de datos.')
      }
    } catch {
      setError('Error de conexion con la API. Asegurese de que el backend este corriendo.')
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
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <XCircle className="w-12 h-12 text-red-500" />
            <p className="text-lg font-semibold text-foreground">Error de conexion</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">{error}</p>
            <Button onClick={cargarDatos} variant="outline" className="mt-2">
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            {/* Vistas Materializadas */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Database className="w-6 h-6" />
                Vistas Materializadas
              </h2>

              {vistas.length > 0 ? (
                <div className="space-y-4">
                  {vistas.map((vista) => {
                    // Mapear campos del backend al frontend
                    const estadoValida = vista.estado === 'valida' || vista.estado === 'VALID'
                    const ultimoRefresh = vista.ultima_actualizacion || vista.ultimo_refresh
                    return (
                      <div key={vista.nombre} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground">{vista.nombre}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{vista.descripcion || '-'}</p>
                            {vista.modo_refresh && (
                              <span className="text-xs text-muted-foreground mt-1 inline-block">
                                Modo refresh: {vista.modo_refresh}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                              {estadoValida ? (
                                <span className="flex items-center gap-1 text-green-500">
                                  <CheckCircle2 className="w-4 h-4" />
                                  ACTUALIZADA
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-500">
                                  <XCircle className="w-4 h-4" />
                                  INVALIDA
                                </span>
                              )}
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
                              {ultimoRefresh ? new Date(ultimoRefresh).toLocaleString('es-CO') : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Espacio estimado</p>
                            <p className="font-semibold text-foreground">~{Math.round((vista.filas || 0) / 1000)} MB</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No hay vistas materializadas disponibles</p>
              )}
            </div>

            {/* Tablespaces */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Gestion de Tablespaces</h2>

              {tablespaces.length > 0 ? (
                <div className="space-y-6">
                  {tablespaces.map((ts) => {
                    // Mapear campos del backend (tamanio_mb, usado_mb, libre_mb, porcentaje_usado)
                    const totalMB = ts.tamanio_mb || 0
                    const usadoMB = ts.usado_mb || 0
                    const libreMB = ts.libre_mb || 0
                    const porcentaje = ts.porcentaje_usado || 0
                    const totalBytes = totalMB * 1024 * 1024
                    const usadoBytes = usadoMB * 1024 * 1024
                    const libreBytes = libreMB * 1024 * 1024
                    return (
                      <div key={ts.nombre} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-foreground">{ts.nombre}</h3>
                          <span className="text-sm font-semibold text-muted-foreground">PERMANENTE</span>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <span>
                              {formatBytes(usadoBytes)} / {formatBytes(totalBytes)} usado
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
                            Disponible: {formatBytes(libreBytes)}
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
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No hay tablespaces disponibles</p>
              )}
            </div>
          </>
        )}

        {/* ===== NUEVA SECCION: TABLESPACES DE REPRODUCCIONES ===== */}
        <SectionTablespacesReproducciones />

        {/* ===== NUEVA SECCION: VISTAS MATERIALIZADAS DETALLE ===== */}
        <SectionVistasMaterializadasDetalle />

        {/* Herramientas adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button variant="outline" className="h-12 text-base justify-start">
            EXPLAIN PLAN de Queries
          </Button>
          <Button variant="outline" className="h-12 text-base justify-start">
            Monitor de Locks
          </Button>
          <Button variant="outline" className="h-12 text-base justify-start">
            Estadisticas de Tablas
          </Button>
          <Button variant="outline" className="h-12 text-base justify-start">
            Backup y Recovery
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Componente: Tablespaces de Reproducciones (TS_REPROD_2024 y TS_REPROD_2025)
// =============================================================================
function SectionTablespacesReproducciones() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const resp = await dbaAPI.tablespacesReproducciones();
      setData(resp.data || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Database className="w-6 h-6" />
          Tablespaces de Reproducciones
        </h2>
        <Button size="sm" variant="outline" onClick={cargar} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Cargando...' : 'Refrescar'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            No se encontraron los tablespaces de reproducciones.
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Ejecute sql/10_tablespaces_particiones.sql en Oracle.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.map((ts) => {
            const totalMB = ts.tamanio_mb || 0;
            const usadoMB = ts.usado_mb || 0;
            const libreMB = ts.libre_mb || 0;
            const porcentaje = ts.porcentaje_usado || 0;
            const totalBytes = totalMB * 1024 * 1024;
            const usadoBytes = usadoMB * 1024 * 1024;
            const libreBytes = libreMB * 1024 * 1024;
            return (
              <div key={ts.nombre} className="border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{ts.nombre}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tabla asociada: {ts.tabla_asociada || 'REPRODUCCIONES_PART'}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-accent/10 text-accent">
                    {ts.tipo || 'PERMANENTE'}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>{formatBytes(usadoBytes)} / {formatBytes(totalBytes)} usado</span>
                    <span className="font-semibold">{porcentaje}%</span>
                  </div>
                  <div className="w-full h-3 bg-card rounded-full overflow-hidden border border-border">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        porcentaje > 80 ? 'bg-red-500' : porcentaje > 60 ? 'bg-yellow-500' : 'bg-accent'
                      }`}
                      style={{ width: `${Math.min(porcentaje, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Disponible: {formatBytes(libreBytes)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground border-t border-border pt-3">
                  <div>
                    <p>Total</p>
                    <p className="font-semibold text-foreground">{formatBytes(totalBytes)}</p>
                  </div>
                  <div>
                    <p>Usado</p>
                    <p className="font-semibold text-foreground">{formatBytes(usadoBytes)}</p>
                  </div>
                  <div>
                    <p>Libre</p>
                    <p className="font-semibold text-foreground">{formatBytes(libreBytes)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Componente: Vistas Materializadas - Detalle
// =============================================================================
function SectionVistasMaterializadasDetalle() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const resp = await dbaAPI.vistasMaterializadasDetalle();
      setData(Array.isArray(resp) ? resp : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const refrescarMV = async (nombre: string) => {
    setRefreshing(nombre);
    try {
      const resp = await dbaAPI.refrescarVistaPorNombre(nombre);
      if (resp.error) {
        toast.error(`Error: ${resp.error}`);
      } else {
        toast.success(`Vista ${nombre} refrescada correctamente`);
        cargar();
      }
    } catch {
      toast.error('Error al refrescar la vista');
    } finally {
      setRefreshing(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Database className="w-6 h-6" />
          Vistas Materializadas del Esquema
        </h2>
        <Button size="sm" variant="outline" onClick={cargar} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Cargando...' : 'Refrescar'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            No hay vistas materializadas en el esquema.
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Ejecute sql/11_vistas_materializadas.sql en Oracle.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((mv) => {
            const estadoValida = mv.estado === 'valida' || mv.estado === 'VALID';
            const ultimoRefresh = mv.ultima_actualizacion || mv.ultimo_refresh;
            return (
              <div key={mv.nombre} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-foreground">{mv.nombre}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        estadoValida
                          ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                          : 'bg-red-500/10 text-red-500 border border-red-500/30'
                      }`}>
                        {estadoValida ? 'ACTUALIZADA' : 'INVALIDA'}
                      </span>
                    </div>
                    {mv.propietario && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Propietario: {mv.propietario}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => refrescarMV(mv.nombre)}
                    disabled={refreshing === mv.nombre}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing === mv.nombre ? 'animate-spin' : ''}`} />
                    {refreshing === mv.nombre ? 'Refrescando...' : 'Refrescar'}
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {mv.filas !== undefined && mv.filas !== null && (
                    <div>
                      <p className="text-muted-foreground text-xs">Filas</p>
                      <p className="font-semibold text-foreground">
                        {(mv.filas || 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground text-xs">Ultimo refresh</p>
                    <p className="font-semibold text-foreground text-xs">
                      {ultimoRefresh
                        ? new Date(ultimoRefresh).toLocaleString('es-CO')
                        : 'Nunca'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Modo refresh</p>
                    <p className="font-semibold text-foreground">
                      {mv.modo_refresh || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Metodo</p>
                    <p className="font-semibold text-foreground">
                      {mv.metodo_refresh || mv.modo_refresh || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
