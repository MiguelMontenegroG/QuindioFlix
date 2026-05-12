'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, Lock, Unlock, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { usuariosAPI } from '@/lib/api';
import type { Usuario } from '@/lib/types';

export default function UsuariosAdminPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(true);

  const cargarUsuarios = async () => {
    setIsLoading(true);
    try {
      const response = await usuariosAPI.obtenerTodos();
      if (response?.data) {
        setUsuarios(response.data);
      }
    } catch {
      console.warn('API no disponible');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const filteredUsuarios = usuarios.filter((u) => {
    const matchesSearch =
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'todos' || u.plan?.nombre === filterPlan;
    return matchesSearch && matchesPlan;
  });

  const toggleUsuario = async (id: number, estadoActual: string) => {
    const esActivo = estadoActual === 'activo' || estadoActual === 'ACTIVO';
    const nuevoEstado = esActivo ? 'INACTIVO' : 'ACTIVO';
    try {
      await usuariosAPI.cambiarEstado(id, nuevoEstado);
      toast.success(`Usuario ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'} correctamente`);
      cargarUsuarios();
    } catch {
      toast.error('Error al cambiar estado del usuario');
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra todos los usuarios de la plataforma</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Total usuarios</p>
            <p className="text-3xl font-bold text-foreground">{usuarios.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Activos</p>
            <p className="text-3xl font-bold text-green-500">
              {usuarios.filter((u) => u.estado === 'activo' || u.estado === 'ACTIVO').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Inactivos</p>
            <p className="text-3xl font-bold text-red-500">
              {usuarios.filter((u) => u.estado !== 'activo' && u.estado !== 'ACTIVO').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-base"
            />
          </div>
          <div>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
            >
              <option value="todos">Todos los planes</option>
              <option value="Basico">Basico</option>
              <option value="Estandar">Estandar</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Ciudad
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Plan
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
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
                    </td>
                  </tr>
                ) : filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b border-border hover:bg-card/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">
                        {usuario.nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{usuario.email}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{usuario.ciudad || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-semibold">
                          {usuario.plan?.nombre || 'Sin plan'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            usuario.estado === 'activo' || usuario.estado === 'ACTIVO'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {usuario.estado === 'activo' || usuario.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleUsuario(usuario.id, usuario.estado)}
                          title={usuario.estado === 'activo' || usuario.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                        >
                          {(usuario.estado === 'activo' || usuario.estado === 'ACTIVO') ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
        </p>
      </div>
    </div>
  );
}
