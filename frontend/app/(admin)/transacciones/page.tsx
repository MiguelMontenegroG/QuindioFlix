'use client';

import { useState } from 'react';
import { Activity, AlertCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TransaccionesPage() {
  const [transactions, setTransactions] = useState([
    {
      id: 'TXN-2024-001',
      usuario: 'Juan Pérez',
      tipo: 'UPDATE',
      tabla: 'FAVORITOS',
      estado: 'En curso',
      inicio: '2024-05-20 14:30:00',
      duracion: '2 segundos',
      estado_bloqueo: 'Activo',
    },
    {
      id: 'TXN-2024-002',
      usuario: 'María García',
      tipo: 'INSERT',
      tabla: 'REPRODUCCIONES',
      estado: 'En curso',
      inicio: '2024-05-20 14:31:00',
      duracion: '1 segundo',
      estado_bloqueo: 'Esperando',
    },
    {
      id: 'TXN-2024-003',
      usuario: 'Carlos López',
      tipo: 'SELECT',
      tabla: 'CONTENIDO',
      estado: 'Completada',
      inicio: '2024-05-20 14:28:00',
      duracion: '0.5 segundos',
      estado_bloqueo: 'Liberado',
    },
  ]);

  const rollbackTransaction = (id: string) => {
    setTransactions(
      transactions.map((t) =>
        t.id === id
          ? { ...t, estado: 'Rollback', estado_bloqueo: 'Liberado' }
          : t
      )
    );
    alert(`Rollback de transacción ${id} completado`);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'En curso':
        return 'bg-blue-500/20 text-blue-500';
      case 'Completada':
        return 'bg-green-500/20 text-green-500';
      case 'Rollback':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getBloqueoColor = (bloqueo: string) => {
    switch (bloqueo) {
      case 'Activo':
        return 'bg-green-500/20 text-green-500';
      case 'Esperando':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'Liberado':
        return 'bg-gray-500/20 text-gray-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const transaccionesActivas = transactions.filter((t) => t.estado === 'En curso');
  const transaccionesCompletadas = transactions.filter((t) => t.estado === 'Completada');
  const transaccionesConProblema = transactions.filter(
    (t) => t.estado_bloqueo === 'Esperando'
  );

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
            <p className="text-3xl font-bold text-green-500">{transaccionesCompletadas.length}</p>
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
                  <th className="px-6 py-4 text-left font-semibold text-foreground">ID Transacción</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Usuario</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Tipo SQL</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Tabla</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Estado</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Bloqueo</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Duración</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-border hover:bg-card/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-accent">
                      {txn.id}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{txn.usuario}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-semibold">
                        {txn.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{txn.tabla}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getEstadoColor(txn.estado)}`}>
                        {txn.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getBloqueoColor(txn.estado_bloqueo)}`}
                      >
                        {txn.estado_bloqueo}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {txn.duracion}
                    </td>
                    <td className="px-6 py-4">
                      {txn.estado === 'En curso' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => rollbackTransaction(txn.id)}
                        >
                          Rollback
                        </Button>
                      )}
                      {txn.estado !== 'En curso' && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
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
