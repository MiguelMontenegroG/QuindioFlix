'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PerfilesPage() {
  const [perfiles, setPerfiles] = useState([
    { id: 1, nombre: 'Mi Perfil', tipo: 'Adulto', activo: true },
    { id: 2, nombre: 'Mi hijo', tipo: 'Infantil', activo: true },
    { id: 3, nombre: 'Mi familia', tipo: 'Adulto', activo: true },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileType, setNewProfileType] = useState('Adulto');

  const planLimits = {
    'Básico': 2,
    'Estándar': 3,
    'Premium': 5,
  };

  const currentPlan = 'Premium';
  const maxPerfiles = planLimits[currentPlan as keyof typeof planLimits];
  const canAddMore = perfiles.length < maxPerfiles;

  const addProfile = () => {
    if (newProfileName.trim() && canAddMore) {
      setPerfiles([
        ...perfiles,
        {
          id: Math.max(...perfiles.map((p) => p.id), 0) + 1,
          nombre: newProfileName,
          tipo: newProfileType,
          activo: true,
        },
      ]);
      setNewProfileName('');
      setNewProfileType('Adulto');
      setShowAddForm(false);
    }
  };

  const deleteProfile = (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este perfil?')) {
      setPerfiles(perfiles.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Mis Perfiles</h1>
            <p className="text-muted-foreground">
              Crea y gestiona los perfiles de tu cuenta
            </p>
          </div>
          {canAddMore && (
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo perfil
            </Button>
          )}
        </div>

        {/* Plan Info */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Plan actual</p>
              <p className="text-lg font-semibold text-foreground">{currentPlan}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Perfiles usados</p>
              <p className="text-2xl font-bold text-accent">
                {perfiles.length} / {maxPerfiles}
              </p>
            </div>
          </div>
          {!canAddMore && (
            <div className="mt-4 flex gap-2 items-start text-sm text-amber-500 bg-amber-500/10 p-3 rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Has alcanzado el máximo de perfiles para tu plan. Actualiza tu plan para crear más.</span>
            </div>
          )}
        </div>

        {/* Add New Profile Form */}
        {showAddForm && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Crear nuevo perfil</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre del perfil
                </label>
                <Input
                  type="text"
                  placeholder="Ej: Mi perfil, Mi hijo..."
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo de perfil
                </label>
                <select
                  value={newProfileType}
                  onChange={(e) => setNewProfileType(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  <option value="Adulto">Adulto - Ver todo el contenido</option>
                  <option value="Infantil">Infantil - Solo contenido TP, +7, +13</option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button onClick={addProfile} disabled={!newProfileName.trim()}>
                  Crear perfil
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewProfileName('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {perfiles.map((perfil) => (
            <div
              key={perfil.id}
              className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{perfil.nombre}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {perfil.tipo === 'Adulto' ? '👤 Perfil de adulto' : '👶 Perfil infantil'}
                  </p>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    perfil.activo
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-red-500/20 text-red-500'
                  }`}
                >
                  {perfil.activo ? 'Activo' : 'Inactivo'}
                </div>
              </div>

              <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                <p>
                  • Tipo:{' '}
                  <span className="text-foreground font-semibold">
                    {perfil.tipo === 'Adulto' ? '+18 años' : 'Menores'}
                  </span>
                </p>
                <p>
                  • Restricción de contenido:{' '}
                  <span className="text-foreground font-semibold">
                    {perfil.tipo === 'Adulto' ? 'Ninguna' : 'TP, +7, +13'}
                  </span>
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Edit2 className="w-4 h-4" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteProfile(perfil.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 bg-card/50 border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Información sobre perfiles</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              • Los perfiles <strong>infantiles</strong> solo pueden ver contenido clasificado
              TP, +7 y +13
            </li>
            <li>
              • Los perfiles <strong>adultos</strong> tienen acceso a todo el contenido de la
              plataforma
            </li>
            <li>
              • Cada perfil mantiene su propio historial de visualización, favoritos y
              calificaciones
            </li>
            <li>
              • El número máximo de perfiles depende de tu plan de suscripción
            </li>
            <li>
              • Puedes cambiar el nombre de un perfil en cualquier momento
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
