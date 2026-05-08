'use client';

import { useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PlanPage() {
  const [currentPlan, setCurrentPlan] = useState('Premium');

  const planes = [
    {
      name: 'Básico',
      precio: '$4.990',
      periodicidad: '/mes',
      descripcion: 'Para empezar',
      perfiles: 2,
      pantallas: 1,
      calidad: 'HD',
      descarga: false,
      features: [
        'Acceso a todo el catálogo',
        '2 perfiles',
        '1 pantalla simultánea',
        'Calidad HD (720p)',
        'Sin descargas',
      ],
    },
    {
      name: 'Estándar',
      precio: '$9.990',
      periodicidad: '/mes',
      descripcion: 'Lo más popular',
      perfiles: 3,
      pantallas: 2,
      calidad: 'Full HD',
      descarga: true,
      features: [
        'Acceso a todo el catálogo',
        '3 perfiles',
        '2 pantallas simultáneas',
        'Calidad Full HD (1080p)',
        'Descargas limitadas',
      ],
      popular: true,
    },
    {
      name: 'Premium',
      precio: '$14.990',
      periodicidad: '/mes',
      descripcion: 'La máxima experiencia',
      perfiles: 5,
      pantallas: 4,
      calidad: '4K',
      descarga: true,
      features: [
        'Acceso a todo el catálogo',
        '5 perfiles',
        '4 pantallas simultáneas',
        'Calidad 4K (2160p)',
        'Descargas ilimitadas',
        'Contenido exclusivo',
      ],
    },
  ];

  const cambiarPlan = (planName: string) => {
    if (planName === currentPlan) {
      alert('Ya tienes este plan');
      return;
    }
    alert(`Cambio a plan ${planName} completado. Se verá reflejado en tu próximo pago.`);
    setCurrentPlan(planName);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Plan y Suscripción</h1>
          <p className="text-muted-foreground">
            Tu plan actual es <span className="text-accent font-semibold">{currentPlan}</span>
          </p>
        </div>

        {/* Warning for plan downgrade */}
        {currentPlan === 'Premium' && (
          <div className="bg-accent/20 border border-accent/50 rounded-lg p-4 mb-8 flex gap-3">
            <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Nota importante</p>
              <p className="text-sm text-muted-foreground mt-1">
                Si reduces a un plan inferior, algunos de tus perfiles podrían ser desactivados.
              </p>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {planes.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-lg border transition-all ${
                currentPlan === plan.name
                  ? 'border-accent bg-card'
                  : 'border-border bg-card hover:border-accent/50'
              } ${plan.popular ? 'md:scale-105 md:shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-background px-3 py-1 rounded-full text-xs font-semibold">
                  MÁS POPULAR
                </div>
              )}

              {currentPlan === plan.name && (
                <div className="absolute top-4 right-4">
                  <div className="bg-accent text-background px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    ACTUAL
                  </div>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-2xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.descripcion}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-3xl font-bold text-accent">{plan.precio}</span>
                  <span className="text-muted-foreground">{plan.periodicidad}</span>
                </div>

                {/* Key Features */}
                <div className="bg-card/50 rounded-lg p-4 mb-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Perfiles</span>
                    <span className="font-semibold text-foreground">{plan.perfiles}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pantallas simultáneas</span>
                    <span className="font-semibold text-foreground">{plan.pantallas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Calidad máxima</span>
                    <span className="font-semibold text-foreground">{plan.calidad}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <Button
                  onClick={() => cambiarPlan(plan.name)}
                  variant={currentPlan === plan.name ? 'outline' : 'default'}
                  className="w-full"
                >
                  {currentPlan === plan.name ? 'Plan actual' : 'Seleccionar plan'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Información adicional</h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              • Los cambios de plan se aplicarán a partir del próximo ciclo de facturación
            </p>
            <p>
              • Si cancelas, tendrás acceso hasta el final de tu período de pago actual
            </p>
            <p>
              • Puedes cambiar entre planes en cualquier momento sin penalización
            </p>
            <p>
              • Los descuentos por referidos se mantienen incluso si cambias de plan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
