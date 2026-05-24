'use client';

import { useEffect, useState } from 'react';
import { Download, Eye, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUsuario, getToken } from '@/lib/auth';
import { pagosAPI, planesAPI } from '@/lib/api';
import type { Pago, Plan } from '@/lib/types';
import { useRouter } from 'next/navigation';

function formatearPrecio(precio: number): string {
  return '$' + Math.round(precio).toLocaleString('es-CO');
}

function mapEstadoPago(estado: string): string {
  const map: Record<string, string> = { 'EXITOSO': 'Exitoso', 'FALLIDO': 'Fallido', 'PENDIENTE': 'Pendiente', 'REEMBOLSADO': 'Reembolsado' };
  return map[estado] || estado;
}

function mapMetodoPago(metodo: string): string {
  const map: Record<string, string> = { 'TARJETA_CREDITO': 'Tarjeta de credito', 'TARJETA_DEBITO': 'Tarjeta de debito', 'PSE': 'PSE', 'NEQUI': 'Nequi', 'DAVIPLATA': 'Daviplata' };
  return map[metodo] || metodo;
}

export default function PagosPage() {
  const router = useRouter();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [planActual, setPlanActual] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    async function cargarPagos() {
      try {
        const token = getToken();
        if (!token) { router.push('/login'); return; }
        const usuarioLocal = getUsuario();
        if (!usuarioLocal) { router.push('/login'); return; }
        const [data, planesData] = await Promise.all([
          pagosAPI.obtenerPorUsuario(usuarioLocal.id),
          planesAPI.obtenerTodos(),
        ]);
        setPagos(data);
        const plan = planesData.find((p: Plan) => p.id === usuarioLocal.id_plan);
        if (plan) setPlanActual(plan);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar pagos');
      } finally { setLoading(false); }
    }
    cargarPagos();
  }, [router]);

  const handlePagar = async () => {
    const usuarioLocal = getUsuario();
    if (!usuarioLocal || !planActual) return;
    setPagando(true);
    setMensaje(null);
    setError(null);
    try {
      const hoy = new Date();
      const vencimiento = new Date(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
      const fechaVenc = vencimiento.toISOString().split('T')[0];

      const nuevoPago = await pagosAPI.crear({
        id_usuario: usuarioLocal.id,
        monto: planActual.precio,
        metodo_pago: 'PSE',
        fecha_vencimiento: fechaVenc,
        estado_pago: 'EXITOSO',
      });

      setPagos([nuevoPago, ...pagos]);
      setMensaje('Pago registrado exitosamente como EXITOSO. Los ingresos de la plataforma se han actualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
    } finally { setPagando(false); }
  };

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'EXITOSO') return 'text-green-500 bg-green-500/20';
    if (s === 'PENDIENTE') return 'text-yellow-500 bg-yellow-500/20';
    if (s === 'FALLIDO') return 'text-red-500 bg-red-500/20';
    if (s === 'REEMBOLSADO') return 'text-blue-500 bg-blue-500/20';
    return 'text-gray-500 bg-gray-500/20';
  };

  const montoTotal = pagos.reduce((sum, p) => sum + p.monto, 0);
  const tienePagoExitosoReciente = pagos.some(p => p.estado_pago === 'EXITOSO' && new Date(p.fecha_pago) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando historial de pagos...</p>
        </div>
      </div>
    );
  }

  if (error && pagos.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Historial de Pagos</h1>
          <p className="text-muted-foreground">Consulta todos tus pagos, transacciones y descargas de recibos</p>
        </div>

        {/* Mensaje de exito/error */}
        {mensaje && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm">
            {mensaje}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Boton Pagar ahora */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {tienePagoExitosoReciente ? 'Tu suscripcion esta al dia' : 'Pendiente de pago'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {planActual
                  ? `Plan ${planActual.nombre} - ${formatearPrecio(planActual.precio)}/mes`
                  : 'Cargando plan...'}
              </p>
            </div>
            <Button
              onClick={handlePagar}
              disabled={pagando || !planActual}
              className="gap-2"
              size="lg"
            >
              {pagando ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
              {pagando ? 'Procesando...' : 'Pagar ahora'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Pagos totales</p>
            <p className="text-3xl font-bold text-foreground">{pagos.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Monto total pagado</p>
            <p className="text-3xl font-bold text-accent">{formatearPrecio(montoTotal)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Ultimo pago</p>
            <p className="text-3xl font-bold text-foreground">
              {pagos.length > 0 ? new Date(pagos[0].fecha_pago).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }) : 'N/A'}
            </p>
          </div>
        </div>

        {pagos.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground text-lg">No tienes pagos registrados aun</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Fecha</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Referencia</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Monto</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Metodo</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Estado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    <tr key={pago.id} className="border-b border-border hover:bg-card/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-foreground">{new Date(pago.fecha_pago).toLocaleDateString('es-CO')}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">#PAY-{String(pago.id).padStart(4, '0')}</td>
                      <td className="px-6 py-4 text-sm text-foreground font-semibold">{formatearPrecio(pago.monto)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{mapMetodoPago(pago.metodo_pago)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(pago.estado_pago)}`}>{mapEstadoPago(pago.estado_pago)}</span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <Button variant="ghost" size="icon" title="Ver detalles"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" title="Descargar recibo"><Download className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 bg-card/50 border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Informacion importante</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>* Los recibos se pueden descargar en PDF hasta 5 anos despues del pago</li>
            <li>* Todos los pagos estan protegidos por nuestra garantia de seguridad</li>
            <li>* Si tienes preguntas sobre un pago, contacta a nuestro equipo de soporte</li>
            <li>* Los reembolsos se procesan en 3-5 dias habiles</li>
          </ul>
        </div>
      </div>
    </div>
  );
}