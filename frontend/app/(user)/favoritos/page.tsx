'use client';

import { useState } from 'react';
import { Heart, Trash2, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentCard } from '@/components/content/content-card';
import { mockContenido } from '@/lib/mock-data';

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<number[]>([1, 3, 5, 7]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const favoriteContent = mockContenido.filter((content) => favorites.includes(content.id));

  const removeFavorite = (id: number) => {
    setFavorites(favorites.filter((favId) => favId !== id));
  };

  const clearAllFavorites = () => {
    if (confirm('¿Estás seguro de que quieres eliminar todos los favoritos?')) {
      setFavorites([]);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-accent fill-accent" />
            <h1 className="text-4xl font-bold text-foreground">Mis Favoritos</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              title="Vista de cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              title="Vista de lista"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <p className="text-muted-foreground">
            Tienes <span className="text-lg font-semibold text-foreground">{favorites.length}</span>{' '}
            elemento{favorites.length !== 1 ? 's' : ''} en tus favoritos
          </p>
          {favorites.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllFavorites}
              className="mt-4"
            >
              Limpiar todos
            </Button>
          )}
        </div>

        {/* Content */}
        {favoriteContent.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {favoriteContent.map((content) => (
                  <div key={content.id} className="relative group">
                    <ContentCard content={content} />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFavorite(content.id)}
                      title="Eliminar de favoritos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {favoriteContent.map((content) => (
                  <div
                    key={content.id}
                    className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-accent transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">{content.titulo}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {content.categoria} • {content.año} • {content.clasificacion}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFavorite(content.id)}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Heart className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Sin favoritos aún</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Agrega contenido a tus favoritos para acceder rápidamente a tus películas, series y
              más.
            </p>
            <Button className="mt-6">Explorar catálogo</Button>
          </div>
        )}
      </div>
    </div>
  );
}
