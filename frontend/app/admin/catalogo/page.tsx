'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { contenidoAPI } from '@/lib/api';
import type { Contenido, CategoriaContenido } from '@/lib/types';

export default function CatalogoPage() {
  const [contenido, setContenido] = useState<Contenido[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    año: new Date().getFullYear(),
    duracion_minutos: 0,
    sinopsis: '',
    clasificacion_edad: 'TP',
    categoria: 'Pelicula' as CategoriaContenido,
    poster_url: '',
    banner_url: '',
    es_original: false,
  });

  const cargarContenido = async () => {
    setIsLoading(true);
    try {
      const response = await contenidoAPI.obtenerTodos({ por_pagina: 100 });
      if (response?.data) {
        setContenido(response.data);
      }
    } catch {
      console.warn('API no disponible');
      const { mockContenido } = await import('@/lib/mock-data');
      setContenido(mockContenido as Contenido[]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarContenido();
  }, []);

  // Función helper para obtener string seguro de cualquier campo que pueda ser objeto
  const getStringValue = (val: any): string => {
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (val && typeof val === 'object' && val.nombre_categoria) return val.nombre_categoria;
    if (val && typeof val === 'object' && val.nombre) return val.nombre;
    return '';
  };

  const filteredContent = contenido.filter((content) => {
    const titulo = getStringValue(content.titulo);
    return titulo.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleAddContent = async () => {
    if (!formData.titulo.trim()) {
      toast.error('El titulo es obligatorio');
      return;
    }
    setIsSaving(true);
    try {
      if (editingId) {
        await contenidoAPI.actualizar(editingId, formData as any);
        toast.success('Contenido actualizado correctamente');
      } else {
        await contenidoAPI.crear(formData as any);
        toast.success('Contenido agregado correctamente');
      }
      setShowForm(false);
      setEditingId(null);
      cargarContenido();
    } catch (err) {
      toast.error(`Error al ${editingId ? 'actualizar' : 'agregar'} contenido`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('Estas seguro de eliminar este contenido?')) return;
    try {
      await contenidoAPI.eliminar(id);
      toast.success('Contenido eliminado');
      cargarContenido();
    } catch {
      toast.error('Error al eliminar contenido');
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Gestión del Catálogo</h1>
            <p className="text-muted-foreground">Gestiona todo el contenido de la plataforma</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Agregar contenido
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {editingId ? 'Editar contenido' : 'Agregar nuevo contenido'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Titulo</label>
                <Input
                  type="text"
                  placeholder="Ej: Pelicula Increible"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Año</label>
                <Input
                  type="number"
                  value={formData.año}
                  onChange={(e) => setFormData({ ...formData, año: parseInt(String(e.target.value)) })}
                  className="text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Duracion (minutos)
                </label>
                <Input
                  type="number"
                  placeholder="120"
                  value={formData.duracion_minutos || ''}
                  onChange={(e) => setFormData({ ...formData, duracion_minutos: parseInt(String(e.target.value)) || 0 })}
                  className="text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Categoria
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value as CategoriaContenido })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  <option value="Pelicula">Peliculas</option>
                  <option value="Serie">Series</option>
                  <option value="Documental">Documentales</option>
                  <option value="Musica">Musica</option>
                  <option value="Podcast">Podcasts</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Clasificacion
                </label>
                <select
                  value={formData.clasificacion_edad}
                  onChange={(e) => setFormData({ ...formData, clasificacion_edad: e.target.value as any })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  <option value="TP">TP</option>
                  <option value="+7">+7</option>
                  <option value="+13">+13</option>
                  <option value="+16">+16</option>
                  <option value="+18">+18</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">URL del poster</label>
                <Input
                  type="text"
                  placeholder="https://ejemplo.com/poster.jpg"
                  value={formData.poster_url}
                  onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                  className="text-base"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.es_original}
                    onChange={(e) => setFormData({ ...formData, es_original: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-semibold text-foreground">Contenido original QuindioFlix</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-foreground mb-2">Sinopsis</label>
              <textarea
                placeholder="Describa el contenido..."
                value={formData.sinopsis}
                onChange={(e) => setFormData({ ...formData, sinopsis: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground min-h-24"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddContent} disabled={isSaving}>
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : (editingId ? 'Guardar cambios' : 'Agregar contenido')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar contenido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-base"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Título</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Año</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Categoría</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Clasificación</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Original</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
                    </td>
                  </tr>
                ) : filteredContent.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No se encontraron contenidos
                    </td>
                  </tr>
                ) : (
                  filteredContent.map((content, index) => (
                    <tr key={(content as any).id || (content as any).ID_CONTENIDO || (content as any).id_contenido || index} className="border-b border-border hover:bg-card/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">{getStringValue((content as any).titulo || (content as any).TITULO)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{(content as any).año || (content as any).ANIO_LANZAMIENTO}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground capitalize">{getStringValue((content as any).categoria) || ((content as any).ID_CATEGORIA ? 'Categoria #' + (content as any).ID_CATEGORIA : '')}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-semibold">
                          {getStringValue((content as any).clasificacion_edad || (content as any).CLASIFICACION_EDAD)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {((content as any).es_original === true || (content as any).es_original === 'S' || (content as any).ES_ORIGINAL === 'S') ? 'Si' : '-'}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const c = content as any;
                            setEditingId(c.id);
                            setFormData({
                              titulo: getStringValue(c.titulo),
                              año: c.año,
                              duracion_minutos: c.duracion_minutos || 0,
                              sinopsis: getStringValue(c.sinopsis || ''),
                              clasificacion_edad: getStringValue(c.clasificacion_edad),
                              categoria: getStringValue(c.categoria) as CategoriaContenido,
                              poster_url: c.poster_url || '',
                              banner_url: c.banner_url || '',
                              es_original: c.es_original === true || c.es_original === 'S',
                            });
                            setShowForm(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEliminar((content as any).id)}>
                          <Trash2 className="w-4 h-4" />
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
          Total: {filteredContent.length} elementos
        </p>
      </div>
    </div>
  );
}
