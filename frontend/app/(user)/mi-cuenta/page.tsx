'use client';

import { User, Mail, Phone, MapPin, Calendar, CreditCard, Users, Share2, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MiCuentaPage() {
  const usuario = {
    id: 1,
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    telefono: '+57 312 3456789',
    ciudad: 'Armenia',
    fechaNacimiento: '1990-05-15',
    plan: 'Premium',
    estado: 'Activo',
    fechaProximoPago: '2024-06-15',
    descuentosActivos: ['Referido: -10%', 'Promoción: -5%'],
    fechaRegistro: '2023-01-20',
  };

  const menuItems = [
    {
      icon: CreditCard,
      title: 'Plan y suscripción',
      description: 'Ver y cambiar tu plan de suscripción',
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
      description: 'Invita amigos y obtén descuentos',
      href: '/mi-cuenta/referidos',
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Mi Cuenta</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y preferencias</p>
        </div>

        {/* User Info Card */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <User className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{usuario.nombre}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Miembro desde {new Date(usuario.fechaRegistro).toLocaleDateString('es-CO')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-semibold">
                {usuario.plan}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Estado: {usuario.estado}</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Correo electrónico</p>
                <p className="text-foreground font-semibold">{usuario.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Teléfono</p>
                <p className="text-foreground font-semibold">{usuario.telefono}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Ciudad</p>
                <p className="text-foreground font-semibold">{usuario.ciudad}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha de nacimiento</p>
                <p className="text-foreground font-semibold">
                  {new Date(usuario.fechaNacimiento).toLocaleDateString('es-CO')}
                </p>
              </div>
            </div>
          </div>

          {/* Próximo pago y descuentos */}
          <div className="border-t border-border pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Próximo pago</p>
                <p className="text-lg font-semibold text-foreground">
                  {new Date(usuario.fechaProximoPago).toLocaleDateString('es-CO')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Descuentos activos</p>
                <div className="space-y-1">
                  {usuario.descuentosActivos.map((desc, i) => (
                    <p key={i} className="text-sm text-accent font-semibold">
                      {desc}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <Button variant="outline">Editar perfil</Button>
            <Button variant="outline">Cambiar contraseña</Button>
            <Button variant="destructive" className="gap-2 ml-auto">
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>

        {/* Menu Items */}
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
