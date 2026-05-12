'use client';

import { useState } from 'react';
import { Shield, UserCog, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface RolAsignado {
  id_empleado: number;
  nombre: string;
  email: string;
  rol_actual: string;
}

export default function RolesAdminPage() {
  const [isLoading] = useState(false);
  const [empleados] = useState<RolAsignado[]>([]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Roles Oracle</h1>
          <p className="text-muted-foreground">Gestion de roles de acceso al sistema</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Shield className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Gestion de roles</h2>
            <p className="text-muted-foreground mb-6">
              Modulo en construccion. Aqui podras asignar roles Oracle a los empleados.
            </p>
            {empleados.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay empleados registrados en el sistema.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
