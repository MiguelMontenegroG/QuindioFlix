'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertCircle, Clock, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { dbaAPI } from '@/lib/api';

export default function TransaccionesPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cargarTransacciones = async () => {
    setIsLoading(true);
    try {
      const data = await dbaAPI.transaccionesActivas();
      if (Array.isArray(data)) {
        setTransactions(data);
      }
    } catch {
      console.warn('API no disponible');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarTransacciones();
    // Polling cada 10 segundos
    const interval = setInterval(cargarTransacciones, 10000);
    return () => clearInterval(interval);
  }, []);

  const rollbackTransaction = (id: string) => {
    toast.success(`Rollback de transaccion ${id} completado (modo simulado)`);
    cargarTransacciones();
  };

  const getEstadoColor = (estado: string = '') => {
    const e = estado.toLowerCase();
    if (e.includes('curso') || e.includes('active')) return 'bg-blue-500/20 text-blue-500';
    if (e.includes('complet') || e.includes('done')) return 'bg-green-500/20 text-green-500';
    if (e.includes('rollback') || e.includes('error')) return 'bg-red-500/20 text-red-500';
    return 'bg-gray-500/20 text-gray-500';
  };

  const getBloqueoColor = (bloqueo: string = '') => {
    const b = bloqueo.toLowerCase();
    if (b.includes('activo') || b.includes('active')) return 'bg-green-500/20 text-green-500';
    if (b.includes('esper') || b.includes('wait')) return 'bg-yellow-500/20 text-yellow-500';
    if (b.includes('liber') || b.includes('free')) return 'bg-gray-500/20 text-gray-500';
    return 'bg-gray-500/20 text-gray-500';
  };

  const transaccionesActivas = transactions.filter((t: any) => {
    const est = (t.estado || t.status || '').toLowerCase();
    return est.includes('curso') || est.includes('active');
  });
  const transaccionesConProblema = transactions.filter((t: any) => {
    const bloqueo = (t.estado_bloqueo || t.lock_status || '').toLowerCase();
    return bloqueo.includes('esper') || bloqueo.includes('wait');
  });

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Monitor de Transacciones
          </h1>
          <p className="text-muted-foreground">
            Monitorea transacciones activas, bloqueos y concurrencia en Oracle
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Total transacciones</p>
            <p className="text-3xl font-bold text-foreground">{transactions.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">En curso</p>
            <p className="text-3xl font-bold text-blue-500">{transaccionesActivas.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Completadas</p>
            <p className="text-3xl font-bold text-green-500">{transactions.length - transaccionesActivas.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Bloqueadas</p>
            <p className="text-3xl font-bold text-yellow-500">{transaccionesConProblema.length}</p>
          </div>
        </div>

        {/* Warning */}
        {transaccionesConProblema.length > 0 && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-8 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Transacciones esperando</p>
              <p className="text-sm text-muted-foreground mt-1">
                {transaccionesConProblema.length} transacción{transaccionesConProblema.length !== 1 ? 'es' : ''}{' '}
                está{transaccionesConProblema.length !== 1 ? 'n' : ''} esperando bloqueos. Considera hacer rollback si
                es necesario.
              </p>
            </div>
          </div>
        )}

        {/* Transacciones Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left font-semibold text-foreground">ID Transaccion</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Usuario</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Tipo SQL</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Tabla</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Estado</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Bloqueo</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Duracion</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                      No hay transacciones activas
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn: any, i: number) => (
                    <tr key={txn.sid || txn.id || i} className="border-b border-border hover:bg-card/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-accent">
                        {txn.sid || txn.id || `TXN-${i}`}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{txn.usuario || txn.username || 'Sistema'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-semibold">
                          {txn.tipo || txn.sql_type || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{txn.tabla || txn.table_name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getEstadoColor(txn.estado || txn.status)}`}>
                          {txn.estado || txn.status || 'Activa'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getBloqueoColor(txn.estado_bloqueo || txn.lock_status)}`}
                        >
                          {txn.estado_bloqueo || txn.lock_status || 'Desconocido'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {txn.duracion || txn.duration || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {(txn.estado === 'En curso' || txn.status === 'ACTIVE') && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => rollbackTransaction(txn.sid || txn.id)}
                          >
                            Rollback
                          </Button>
                        )}
                        {txn.estado !== 'En curso' && txn.status !== 'ACTIVE' && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Información */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Sobre este monitor
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              • Este monitor simula el comportamiento de transacciones en Oracle usando{' '}
              <span className="font-mono text-foreground">SELECT FOR UPDATE</span> para demostrar
              bloqueos.
            </p>
            <p>
              • Las transacciones &quot;Esperando&quot; están esperando por locks que poseen otras
              transacciones.
            </p>
            <p>
              • El rollback termina la transacción sin hacer commit de los cambios.
            </p>
            <p>
              • En producción, este monitor ayuda a identificar transacciones de larga duración y
              posibles deadlocks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
