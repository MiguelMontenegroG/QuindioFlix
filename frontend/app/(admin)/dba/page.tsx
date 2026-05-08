'use client';

import { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DBAPage() {
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const vistasMateriakizadas = [
    {
      nombre: 'V_CONSUMO_POR_CIUDAD',
      descripcion: 'Consumo de contenido agrupado por ciudad y plan',
      ultimoRefresh: '2024-05-20 14:30:00',
      estado: 'Actualizada',
      filas: 145680,
    },
    {
      nombre: 'V_INGRESOS_MENSUALES',
      descripcion: 'Ingresos totales por mes y por plan',
      ultimoRefresh: '2024-05-20 14:15:00',
      estado: 'Actualizada',
      filas: 60,
    },
  ];

  const indices = [
    {
      tabla: 'REPRODUCCIONES',
      indice: 'IDX_REPRODUCCIONES_USUARIO_FECHA',
      columnas: 'usuario_id, fecha_inicio',
      tamaño: '245 MB',
      estado: 'Activo',
    },
    {
      tabla: 'CONTENIDO',
      indice: 'IDX_CONTENIDO_CATEGORIA',
      columnas: 'categoria, estado',
      tamaño: '12 MB',
      estado: 'Activo',
    },
    {
      tabla: 'USUARIOS',
      indice: 'IDX_USUARIOS_EMAIL',
      columnas: 'email',
      tamaño: '8 MB',
      estado: 'Activo',
    },
  ];

  const tablespaces = [
    {
      nombre: 'QUINDIOFLIX_DATA',
      tipo: 'Permanente',
      tamaño: '1.2 GB',
      usado: '856 MB',
      disponible: '344 MB',
      porcentaje: 71,
    },
    {
      nombre: 'QUINDIOFLIX_TEMP',
      tipo: 'Temporal',
      tamaño: '512 MB',
      usado: '128 MB',
      disponible: '384 MB',
      porcentaje: 25,
    },
  ];

  const refreshVistasMaterializadas = async (vista: string) => {
    setRefreshing(vista);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    alert(`Vista ${vista} refrescada correctamente`);
    setRefreshing(null);
  };

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

        {/* Vistas Materializadas */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Database className="w-6 h-6" />
            Vistas Materializadas
          </h2>

          <div className="space-y-4">
            {vistasMateriakizadas.map((vista) => (
              <div key={vista.nombre} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{vista.nombre}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{vista.descripcion}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-green-500 text-sm font-semibold mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {vista.estado}
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
                    <p className="font-semibold text-foreground">{vista.filas.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Último refresh</p>
                    <p className="font-semibold text-foreground text-xs">{vista.ultimoRefresh}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Espacio estimado</p>
                    <p className="font-semibold text-foreground">~{Math.round(vista.filas / 1000)} MB</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Índices */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Índices de Base de Datos</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Tabla</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Índice</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Columnas</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Tamaño</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {indices.map((indice, i) => (
                  <tr key={i} className="border-b border-border hover:bg-card/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{indice.tabla}</td>
                    <td className="px-4 py-3 text-muted-foreground">{indice.indice}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{indice.columnas}</td>
                    <td className="px-4 py-3 text-muted-foreground">{indice.tamaño}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs font-semibold">
                        {indice.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm">
                        Analizar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tablespaces */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Gestión de Tablespaces</h2>

          <div className="space-y-6">
            {tablespaces.map((ts) => (
              <div key={ts.nombre} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-foreground">{ts.nombre}</h3>
                  <span className="text-sm font-semibold text-muted-foreground">{ts.tipo}</span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>
                      {ts.usado} / {ts.tamaño} usado
                    </span>
                    <span>{ts.porcentaje}%</span>
                  </div>
                  <div className="w-full h-3 bg-card rounded-full overflow-hidden">
                    <div
                      className={`h-full ${ts.porcentaje > 80 ? 'bg-red-500' : 'bg-accent'}`}
                      style={{ width: `${ts.porcentaje}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Disponible: {ts.disponible}
                  </p>
                </div>

                {ts.porcentaje > 80 && (
                  <div className="flex gap-2 items-start text-sm text-yellow-500 bg-yellow-500/10 p-2 rounded">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Espacio bajo. Considera hacer un resize o limpieza.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

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
