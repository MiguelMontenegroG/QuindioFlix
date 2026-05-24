'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUsuario, getToken } from '@/lib/auth';
import { perfilesAPI, planesAPI } from '@/lib/api';
import type { Perfil, Plan } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function PerfilesPage() {
  const router = useRouter();
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [planActual, setPlanActual] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileType, setNewProfileType] = useState('ADULTO');
  const [creando, setCreando] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [editandoPerfil, setEditandoPerfil] = useState<Perfil | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTipo, setEditTipo] = useState('ADULTO');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const token = getToken();
        if (!token) { router.push('/login'); return; }
        const usuarioLocal = getUsuario();
        if (!usuarioLocal) { router.push('/login'); return; }
        const [perfilesData, planesData] = await Promise.all([
          perfilesAPI.obtenerPorUsuario(usuarioLocal.id),
          planesAPI.obtenerTodos(),
        ]);
        setPerfiles(perfilesData);
        const plan = planesData.find((p: Plan) => p.id === usuarioLocal.id_plan);
        if (plan) setPlanActual(plan);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally { setLoading(false); }
    }
    cargarDatos();
  }, [router]);

  const addProfile = async () => {
    if (!newProfileName.trim()) return;
    const usuarioLocal = getUsuario();
    if (!usuarioLocal) return;
    setCreando(true);
    try {
      const nuevoPerfil = await perfilesAPI.crear({
        id_usuario: usuarioLocal.id,
        nombre: newProfileName.trim(),
        es_infantil: newProfileType === 'INFANTIL',
      });
      setPerfiles([...perfiles, nuevoPerfil]);
      setNewProfileName('');
      setNewProfileType('ADULTO');
      setShowAddForm(false);
    } catch (err) {
      alert('Error al crear perfil: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally { setCreando(false); }
  };

    const deleteProfile = async (id: number) => {
    if (!confirm('Esta seguro de que quieres eliminar este perfil?')) return;
    setEliminando(id);
    try {
      await perfilesAPI.eliminar(id);
      setPerfiles(perfiles.filter((p) => p.id !== id));
    } catch (err) {
      alert('Error al eliminar perfil: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally { setEliminando(null); }
  };

  const openEditForm = (perfil: Perfil) => {
    setEditandoPerfil(perfil);
    setEditNombre(perfil.nombre);
    setEditTipo(perfil.es_infantil ? 'INFANTIL' : 'ADULTO');
  };

  const saveEdit = async () => {
    if (!editandoPerfil || !editNombre.trim()) return;
    setGuardando(true);
    try {
      const actualizado = await perfilesAPI.actualizar(editandoPerfil.id, {
        nombre: editNombre.trim(),
        es_infantil: editTipo === 'INFANTIL',
      });
      setPerfiles(perfiles.map((p) => p.id === actualizado.id ? actualizado : p));
      setEditandoPerfil(null);
    } catch (err) {
      alert('Error al actualizar perfil: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally { setGuardando(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando perfiles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const maxPerfiles = planActual?.max_perfiles || 5;
  const canAddMore = perfiles.length < maxPerfiles;

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Mis Perfiles</h1>
            <p className="text-muted-foreground">Crea y gestiona los perfiles de tu cuenta</p>
          </div>
          {canAddMore && (
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo perfil
            </Button>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Plan actual</p>
              <p className="text-lg font-semibold text-foreground">{planActual?.nombre || 'Sin plan'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Perfiles usados</p>
              <p className="text-2xl font-bold text-accent">{perfiles.length} / {maxPerfiles}</p>
            </div>
          </div>
          {!canAddMore && (
            <div className="mt-4 flex gap-2 items-start text-sm text-amber-500 bg-amber-500/10 p-3 rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Has alcanzado el maximo de perfiles para tu plan. Actualiza tu plan para crear mas.</span>
            </div>
          )}
        </div>

        {showAddForm && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Crear nuevo perfil</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nombre del perfil</label>
                <Input type="text" placeholder="Ej: Mi perfil, Mi hijo..." value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} className="text-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tipo de perfil</label>
                <select value={newProfileType} onChange={(e) => setNewProfileType(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground">
                  <option value="ADULTO">Adulto - Ver todo el contenido</option>
                  <option value="INFANTIL">Infantil - Solo contenido TP, +7, +13</option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button onClick={addProfile} disabled={!newProfileName.trim() || creando}>{creando ? 'Creando...' : 'Crear perfil'}</Button>
                <Button variant="outline" onClick={() => { setShowAddForm(false); setNewProfileName(''); }}>Cancelar</Button>
              </div>
            </div>
          </div>
        )}

                {/* Edit Profile Modal */}
        {editandoPerfil && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">Editar perfil: {editandoPerfil.nombre}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nombre del perfil</label>
                  <Input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="text-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tipo de perfil</label>
                  <select value={editTipo} onChange={(e) => setEditTipo(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground">
                    <option value="ADULTO">Adulto - Ver todo el contenido</option>
                    <option value="INFANTIL">Infantil - Solo contenido TP, +7, +13</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <Button onClick={saveEdit} disabled={!editNombre.trim() || guardando}>{guardando ? 'Guardando...' : 'Guardar cambios'}</Button>
                  <Button variant="outline" onClick={() => setEditandoPerfil(null)}>Cancelar</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {perfiles.map((perfil) => (
            <div key={perfil.id} className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{perfil.nombre}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{perfil.es_infantil ? 'Perfil infantil' : 'Perfil de adulto'}</p>
                </div>
                <div className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-500">Activo</div>
              </div>
              <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                <p>* Tipo: <span className="text-foreground font-semibold">{perfil.es_infantil ? 'Menores' : '+18 anos'}</span></p>
                <p>* Restriccion de contenido: <span className="text-foreground font-semibold">{perfil.es_infantil ? 'TP, +7, +13' : 'Ninguna'}</span></p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => openEditForm(perfil)}><Edit2 className="w-4 h-4" />Editar</Button>
                <Button variant="destructive" size="sm" onClick={() => deleteProfile(perfil.id)} disabled={eliminando === perfil.id}>
                  {eliminando === perfil.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-card/50 border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Informacion sobre perfiles</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>* Los perfiles <strong>infantiles</strong> solo pueden ver contenido clasificado TP, +7 y +13</li>
            <li>* Los perfiles <strong>adultos</strong> tienen acceso a todo el contenido de la plataforma</li>
            <li>* Cada perfil mantiene su propio historial de visualizacion, favoritos y calificaciones</li>
            <li>* El numero maximo de perfiles depende de tu plan de suscripcion</li>
            <li>* Puedes cambiar el nombre de un perfil en cualquier momento</li>
          </ul>
        </div>
      </div>
    </div>
  );
}