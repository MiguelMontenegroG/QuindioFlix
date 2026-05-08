'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockContenido } from '@/lib/mock-data';

export default function CatalogoPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    año: new Date().getFullYear(),
    duracion: '',
    sinopsis: '',
    clasificacion: 'TP',
    categoria: 'Películas',
    generos: [] as string[],
    esOriginal: false,
  });

  const filteredContent = mockContenido.filter((content) =>
    content.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddContent = () => {
    if (formData.titulo.trim()) {
      alert('Contenido agregado: ' + formData.titulo);
      setShowForm(false);
      setFormData({
        titulo: '',
        año: new Date().getFullYear(),
        duracion: '',
        sinopsis: '',
        clasificacion: 'TP',
        categoria: 'Películas',
        generos: [],
        esOriginal: false,
      });
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
                <label className="block text-sm font-semibold text-foreground mb-2">Título</label>
                <Input
                  type="text"
                  placeholder="Ej: Película Increíble"
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
                  onChange={(e) => setFormData({ ...formData, año: parseInt(e.target.value) })}
                  className="text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Duración (minutos)
                </label>
                <Input
                  type="number"
                  placeholder="120"
                  value={formData.duracion}
                  onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                  className="text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Categoría
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  <option>Películas</option>
                  <option>Series</option>
                  <option>Documentales</option>
                  <option>Música</option>
                  <option>Podcasts</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Clasificación
                </label>
                <select
                  value={formData.clasificacion}
                  onChange={(e) => setFormData({ ...formData, clasificacion: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  <option>TP</option>
                  <option>+7</option>
                  <option>+13</option>
                  <option>+18</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.esOriginal}
                    onChange={(e) => setFormData({ ...formData, esOriginal: e.target.checked })}
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
              <Button onClick={handleAddContent}>
                {editingId ? 'Guardar cambios' : 'Agregar contenido'}
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
                {filteredContent.map((content) => (
                  <tr key={content.id} className="border-b border-border hover:bg-card/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{content.titulo}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{content.año}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{content.categoria}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-semibold">
                        {content.clasificacion}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {content.esOriginal ? '✓' : '-'}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingId(content.id)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Total: {filteredContent.length} elemento{filteredContent.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
