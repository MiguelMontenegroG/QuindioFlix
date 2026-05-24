'use client';

import { useEffect, useState } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUsuario, getToken } from '@/lib/auth';
import { planesAPI, usuariosAPI } from '@/lib/api';
import type { Plan } from '@/lib/types';
import { useRouter } from 'next/navigation';

function formatearPrecio(precio: number): string {
  return '$' + Math.round(precio).toLocaleString('es-CO');
}

const PLAN_IDS: Record<string, number> = { 'Basico': 1, 'Estandar': 2, 'Premium': 3 };

export default function PlanPage() {
  const router = useRouter();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [idPlanActual, setIdPlanActual] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [cambiando, setCambiando] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const token = getToken();
        if (!token) { router.push('/login'); return; }
        const usuarioLocal = getUsuario();
        if (!usuarioLocal) { router.push('/login'); return; }
        const [planesData, usuarioData] = await Promise.all([
          planesAPI.obtenerTodos(),
          usuariosAPI.obtenerPorId(usuarioLocal.id),
        ]);
        setPlanes(planesData);
        setIdPlanActual(usuarioData.id_plan || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally { setLoading(false); }
    }
    cargarDatos();
  }, [router]);

  const cambiarPlan = async (planName: string) => {
    const planId = PLAN_IDS[planName];
    const usuarioLocal = getUsuario();
    if (!planId || !usuarioLocal) return;
    if (planId === idPlanActual) {
      setMensaje('Ya tienes este plan');
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    setCambiando(planId);
    setMensaje(null);
    setError(null);
    try {
      await planesAPI.cambiarPlan(usuarioLocal.id, planId);
      setIdPlanActual(planId);
      setMensaje('Cambio a plan ' + planName + ' exitoso. Se reflejara en tu proximo pago.');
    } catch (err) {
      setError('Error al cambiar de plan: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally { setCambiando(null); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando planes disponibles...</p>
        </div>
      </div>
    );
  }

  if (error && planes.length === 0) {
    return <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center"><p className="text-red-500">{error}</p></div>;
  }

  const planActual = planes.find((p) => p.id === idPlanActual);
  const nombrePlanActual = planActual?.nombre || 'Desconocido';

  const featuresPorPlan: Record<string, string[]> = {
    'Basico': ['Acceso a todo el catalogo', '2 perfiles', '1 pantalla simultanea', 'Calidad SD', 'Sin descargas'],
    'Estandar': ['Acceso a todo el catalogo', '3 perfiles', '2 pantallas simultaneas', 'Calidad HD', 'Descargas limitadas'],
    'Premium': ['Acceso a todo el catalogo', '5 perfiles', '4 pantallas simultaneas', 'Calidad 4K', 'Descargas ilimitadas', 'Contenido exclusivo'],
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Plan y Suscripcion</h1>
          <p className="text-muted-foreground">Tu plan actual es <span className="text-accent font-semibold">{nombrePlanActual}</span></p>
        </div>

        {mensaje && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-8 flex gap-3">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{mensaje}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{error}</p>
          </div>
        )}

        {nombrePlanActual === 'Premium' && (
          <div className="bg-accent/20 border border-accent/50 rounded-lg p-4 mb-8 flex gap-3">
            <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Nota importante</p>
              <p className="text-sm text-muted-foreground mt-1">Si reduces a un plan inferior, algunos de tus perfiles podrian ser desactivados.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {planes.map((plan) => {
            const esActual = plan.id === idPlanActual;
            const esPopular = plan.id === 2;
            const features = featuresPorPlan[plan.nombre] || [];
            return (
              <div key={plan.id} className={`relative rounded-lg border transition-all ${esActual ? 'border-accent bg-card' : 'border-border bg-card hover:border-accent/50'} ${esPopular ? 'md:scale-105 md:shadow-lg' : ''}`}>
                {esPopular && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-background px-3 py-1 rounded-full text-xs font-semibold">MAS POPULAR</div>}
                {esActual && <div className="absolute top-4 right-4"><div className="bg-accent text-background px-2 py-1 rounded text-xs font-semibold flex items-center gap-1"><Check className="w-3 h-3" />ACTUAL</div></div>}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-1">{plan.nombre}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.id === 1 ? 'Para empezar' : plan.id === 2 ? 'Lo mas popular' : 'La maxima experiencia'}</p>
                  <div className="mb-6"><span className="text-3xl font-bold text-accent">{formatearPrecio(plan.precio)}</span><span className="text-muted-foreground">/mes</span></div>
                  <div className="bg-card/50 rounded-lg p-4 mb-6 space-y-3">
                    <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Perfiles</span><span className="font-semibold text-foreground">{plan.max_perfiles}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Pantallas simultaneas</span><span className="font-semibold text-foreground">{plan.max_pantallas}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Calidad maxima</span><span className="font-semibold text-foreground">{plan.calidad}</span></div>
                  </div>
                  <div className="space-y-3 mb-6">{features.map((f, i) => (<div key={i} className="flex gap-2 items-start"><Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" /><span className="text-sm text-muted-foreground">{f}</span></div>))}</div>
                  <Button onClick={() => cambiarPlan(plan.nombre)} variant={esActual ? 'outline' : 'default'} className="w-full" disabled={cambiando !== null}>
                    {cambiando === plan.id ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />Cambiando...</>) : esActual ? 'Plan actual' : 'Seleccionar plan'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Informacion adicional</h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>* Los cambios de plan se aplicaran a partir del proximo ciclo de facturacion</p>
            <p>* Si cancelas, tendras acceso hasta el final de tu periodo de pago actual</p>
            <p>* Puedes cambiar entre planes en cualquier momento sin penalizacion</p>
            <p>* Los descuentos por referidos se mantienen incluso si cambias de plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}