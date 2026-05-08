'use client';

import { Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PagosPage() {
  const pagos = [
    {
      id: 1,
      fecha: '2024-05-15',
      monto: '$14.990',
      plan: 'Premium',
      metodo: 'Tarjeta de crédito',
      estado: 'Exitoso',
      referencia: '#PAY-2024-0001',
    },
    {
      id: 2,
      fecha: '2024-04-15',
      monto: '$14.990',
      plan: 'Premium',
      metodo: 'Tarjeta de crédito',
      estado: 'Exitoso',
      referencia: '#PAY-2024-0002',
    },
    {
      id: 3,
      fecha: '2024-03-15',
      monto: '$14.990',
      plan: 'Premium',
      metodo: 'Tarjeta de crédito',
      estado: 'Exitoso',
      referencia: '#PAY-2024-0003',
    },
    {
      id: 4,
      fecha: '2024-02-15',
      monto: '$14.990',
      plan: 'Premium',
      metodo: 'Transferencia bancaria',
      estado: 'Exitoso',
      referencia: '#PAY-2024-0004',
    },
    {
      id: 5,
      fecha: '2024-01-15',
      monto: '$14.990',
      plan: 'Premium',
      metodo: 'Tarjeta de crédito',
      estado: 'Exitoso',
      referencia: '#PAY-2024-0005',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Exitoso':
        return 'text-green-500 bg-green-500/20';
      case 'Pendiente':
        return 'text-yellow-500 bg-yellow-500/20';
      case 'Fallido':
        return 'text-red-500 bg-red-500/20';
      case 'Reembolsado':
        return 'text-blue-500 bg-blue-500/20';
      default:
        return 'text-gray-500 bg-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Historial de Pagos</h1>
          <p className="text-muted-foreground">
            Consulta todos tus pagos, transacciones y descargas de recibos
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Pagos totales</p>
            <p className="text-3xl font-bold text-foreground">{pagos.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Monto total pagado</p>
            <p className="text-3xl font-bold text-accent">$74.950</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Próximo pago</p>
            <p className="text-3xl font-bold text-foreground">15 de junio</p>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Referencia
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Monto
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Método
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id} className="border-b border-border hover:bg-card/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground">
                      {new Date(pago.fecha).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{pago.referencia}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      {pago.plan}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      {pago.monto}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{pago.metodo}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          pago.estado
                        )}`}
                      >
                        {pago.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <Button variant="ghost" size="icon" title="Ver detalles">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Descargar recibo">
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-card/50 border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Información importante</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Los recibos se pueden descargar en PDF hasta 5 años después del pago</li>
            <li>• Todos los pagos están protegidos por nuestra garantía de seguridad</li>
            <li>• Si tienes preguntas sobre un pago, contacta a nuestro equipo de soporte</li>
            <li>• Los reembolsos se procesan en 3-5 días hábiles</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
