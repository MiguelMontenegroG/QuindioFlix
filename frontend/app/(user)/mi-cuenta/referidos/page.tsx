'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ReferidosPage() {
  const [copied, setCopied] = useState(false);
  const codigoReferido = 'QF-JUAN92-X7K2L';

  const referidos = [
    { id: 1, nombre: 'María García', email: 'maria@example.com', fecha: '2024-04-15', descuento: '-10%' },
    { id: 2, nombre: 'Carlos López', email: 'carlos@example.com', fecha: '2024-03-20', descuento: '-10%' },
    { id: 3, nombre: 'Ana Martínez', email: 'ana@example.com', fecha: '2024-02-10', descuento: '-10%' },
  ];

  const descuentosRecibidos = [
    { id: 1, monto: '$1.499', fecha: '2024-04-20', razon: 'Referido: María García' },
    { id: 2, monto: '$1.499', fecha: '2024-03-25', razon: 'Referido: Carlos López' },
    { id: 3, monto: '$1.499', fecha: '2024-02-15', razon: 'Referido: Ana Martínez' },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codigoReferido);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Referidos</h1>
          <p className="text-muted-foreground">
            Invita amigos y ambos reciben descuentos en tu próximo pago
          </p>
        </div>

        {/* Referral Code Section */}
        <div className="bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Tu código de referido</h2>
          <p className="text-muted-foreground mb-6">
            Comparte tu código con amigos. Ambos recibirán un descuento de 10% en el próximo pago
            cuando se registren con tu código.
          </p>

          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Input
                type="text"
                value={codigoReferido}
                readOnly
                className="text-center font-mono text-lg font-bold h-12"
              />
            </div>
            <Button
              onClick={copyToClipboard}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </Button>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-3">
              <span className="font-semibold text-foreground">¿Cómo funciona?</span>
            </p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Comparte tu código con amigos</li>
              <li>2. Ellos se registran con tu código</li>
              <li>3. Ambos reciben 10% de descuento en el próximo pago</li>
              <li>4. El descuento se aplica automáticamente en tu factura</li>
            </ol>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Referidos Activos */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Referidos activos</h2>
            {referidos.length > 0 ? (
              <div className="space-y-3">
                {referidos.map((referido) => (
                  <div
                    key={referido.id}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground">{referido.nombre}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{referido.email}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs font-semibold">
                        {referido.descuento}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Se registró: {new Date(referido.fecha).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">
                  Aún no tienes referidos. ¡Comparte tu código para empezar!
                </p>
              </div>
            )}
          </div>

          {/* Descuentos Recibidos */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Descuentos recibidos</h2>
            {descuentosRecibidos.length > 0 ? (
              <div className="space-y-3">
                {descuentosRecibidos.map((descuento) => (
                  <div
                    key={descuento.id}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{descuento.razon}</h4>
                      <span className="text-lg font-bold text-accent">{descuento.monto}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aplicado: {new Date(descuento.fecha).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">
                  Los descuentos aparecerán aquí cuando tus referidos se registren.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-accent mb-1">{referidos.length}</p>
            <p className="text-sm text-muted-foreground">Referidos activos</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-accent mb-1">
              $
              {(descuentosRecibidos.length * 1499).toLocaleString('es-CO')}
            </p>
            <p className="text-sm text-muted-foreground">Total ahorrado</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-accent mb-1">10%</p>
            <p className="text-sm text-muted-foreground">Descuento por referido</p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-card/50 border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Preguntas frecuentes</h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-1">¿Hay límite de referidos?</p>
              <p>No, puedes invitar a tantos amigos como quieras. No hay límite de descuentos.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">¿Cuándo se aplica el descuento?</p>
              <p>El descuento se aplica automáticamente en el próximo ciclo de facturación después del registro.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">¿Pueden cancelar el descuento?</p>
              <p>El descuento es permanente mientras tu referido mantenga su suscripción activa.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
