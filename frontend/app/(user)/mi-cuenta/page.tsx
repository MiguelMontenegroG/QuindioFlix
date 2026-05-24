'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, CreditCard, Users, Share2, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getUsuario, logout as cerrarSesion, getToken } from '@/lib/auth';
import { usuariosAPI, planesAPI, pagosAPI } from '@/lib/api';
import type { Usuario, Plan, Pago } from '@/lib/types';
import { useRouter } from 'next/navigation';

function formatearPrecio(precio: number): string {
  return '$' + Math.round(precio).toLocaleString('es-CO');
}

export default function MiCuentaPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [nombrePlan, setNombrePlan] = useState<string>('');
  const [ultimoPago, setUltimoPago] = useState<Pago | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const token = getToken();
        if (!token) {
          router.push('/login');
          return;
        }

        const usuarioLocal = getUsuario();
        if (!usuarioLocal) {
          router.push('/login');
          return;
        }

        setUsuario(usuarioLocal);

        const [usuarioActualizado, planes, pagos] = await Promise.all([
          usuariosAPI.obtenerPorId(usuarioLocal.id),
          planesAPI.obtenerTodos(),
          pagosAPI.obtenerPorUsuario(usuarioLocal.id).catch(() => [] as Pago[]),
        ]);

        setUsuario(usuarioActualizado);

        if (usuarioActualizado.id_plan) {
          const plan = planes.find((p: Plan) => p.id === usuarioActualizado.id_plan);
          if (plan) setNombrePlan(plan.nombre);
        }

        if (pagos.length > 0) {
          setUltimoPago(pagos[0]);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar datos';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();
  }, [router]);

  const handleLogout = () => {
    cerrarSesion();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando informacion de la cuenta...</p>
        </div>
      </div>
    );
  }

  if (error || !usuario) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'No se pudo cargar la informacion del usuario'}</p>
          <Button onClick={() => router.push('/login')}>Iniciar sesion</Button>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      icon: CreditCard,
      title: 'Plan y suscripcion',
      description: 'Ver y cambiar tu plan de suscripcion',
      href: '/mi-cuenta/plan',
    },
    {
      icon: CreditCard,
      title: 'Historial de pagos',
      description: 'Consulta tus transacciones y recibos',
      href: '/mi-cuenta/pagos',
    },
    {
      icon: Users,
      title: 'Mis perfiles',
      description: 'Gestiona tus perfiles de usuario',
      href: '/mi-cuenta/perfiles',
    },
    {
      icon: Share2,
      title: 'Referidos',
      description: 'Invita amigos y obten descuentos',
      href: '/mi-cuenta/referidos',
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Mi Cuenta</h1>
          <p className="text-muted-foreground">Gestiona tu informacion personal y preferencias</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <User className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{usuario.nombre}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Miembro desde {usuario.fecha_registro ? new Date(usuario.fecha_registro).toLocaleDateString('es-CO') : 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-semibold">
                {nombrePlan || 'Sin plan'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Estado: {usuario.estado}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Correo electronico</p>
                <p className="text-foreground font-semibold">{usuario.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Telefono</p>
                <p className="text-foreground font-semibold">{usuario.telefono || 'No registrado'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Ciudad</p>
                <p className="text-foreground font-semibold">{usuario.ciudad || 'No registrada'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha de nacimiento</p>
                <p className="text-foreground font-semibold">
                  {usuario.fecha_nacimiento ? new Date(usuario.fecha_nacimiento).toLocaleDateString('es-CO') : 'No registrada'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ultimo pago</p>
                <p className="text-lg font-semibold text-foreground">
                  {ultimoPago ? formatearPrecio(ultimoPago.monto) + ' - ' + new Date(ultimoPago.fecha_pago).toLocaleDateString('es-CO') : 'Sin pagos registrados'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Plan actual</p>
                <p className="text-lg font-semibold text-accent">
                  {nombrePlan || 'Sin asignar'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <Button variant="outline" onClick={() => router.push('/mi-cuenta/perfiles')}>Editar perfil</Button>
            <Button variant="destructive" className="gap-2 ml-auto" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Cerrar sesion
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}