'use client'

import { useState, useEffect } from 'react'
import { Edit2, Save, X, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { planesAPI } from '@/lib/api'
import type { Plan } from '@/lib/types'

export default function PlanesAdminPage() {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    nombre: '',
    precio: 0,
    max_pantallas: 0,
    calidad: '',
    max_perfiles: 0,
    descripcion: '',
  })

  const cargarPlanes = async () => {
    setIsLoading(true)
    try {
      const data = await planesAPI.obtenerTodos()
      if (Array.isArray(data)) {
        setPlanes(data)
      }
    } catch {
      console.warn('API no disponible, usando datos mock')
      const { mockPlanes } = await import('@/lib/mock-data')
      setPlanes(mockPlanes as Plan[])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarPlanes()
  }, [])

  const startEditing = (plan: Plan) => {
    setEditingId(plan.id)
    setEditForm({
      nombre: plan.nombre,
      precio: plan.precio,
      max_pantallas: plan.max_pantallas,
      calidad: plan.calidad,
      max_perfiles: plan.max_perfiles,
      descripcion: plan.descripcion || '',
    })
  }

  const saveEdit = async (id: number) => {
    setIsSaving(true)
    try {
      await planesAPI.actualizar(id, editForm)
      toast.success('Plan actualizado correctamente')
      setEditingId(null)
      cargarPlanes()
    } catch {
      toast.error('Error al actualizar el plan')
    } finally {
      setIsSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Planes de suscripción</h1>
          <p className="text-muted-foreground">
            Administra los planes, precios y características de suscripción
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {planes.map((plan) => (
            <div
              key={plan.id}
              className="bg-card border border-border rounded-lg p-6 relative"
            >
              {editingId === plan.id ? (
                /* Modo edición */
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
                    <Input
                      value={editForm.nombre}
                      onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Precio (COP)</label>
                    <Input
                      type="number"
                      value={editForm.precio}
                      onChange={(e) => setEditForm({ ...editForm, precio: Number(e.target.value) })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Calidad</label>
                    <select
                      value={editForm.calidad}
                      onChange={(e) => setEditForm({ ...editForm, calidad: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground"
                    >
                      <option value="HD">HD</option>
                      <option value="Full HD">Full HD</option>
                      <option value="4K">4K</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Pantallas</label>
                      <Input
                        type="number"
                        value={editForm.max_pantallas}
                        onChange={(e) => setEditForm({ ...editForm, max_pantallas: Number(e.target.value) })}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Perfiles máx</label>
                      <Input
                        type="number"
                        value={editForm.max_perfiles}
                        onChange={(e) => setEditForm({ ...editForm, max_perfiles: Number(e.target.value) })}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
                    <textarea
                      value={editForm.descripcion}
                      onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(plan.id)} disabled={isSaving} className="gap-1">
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1">
                      <X className="w-3 h-3" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                /* Modo vista */
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-foreground">{plan.nombre}</h3>
                    <Button variant="ghost" size="icon" onClick={() => startEditing(plan)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-accent">
                      ${plan.precio.toLocaleString('es-CO')}
                    </span>
                    <span className="text-muted-foreground"> /mes</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        Pantallas
                      </span>
                      <span className="font-semibold text-foreground">{plan.max_pantallas}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Perfiles máx
                      </span>
                      <span className="font-semibold text-foreground">{plan.max_perfiles}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Calidad
                      </span>
                      <Badge className="bg-accent/20 text-accent">{plan.calidad}</Badge>
                    </div>
                  </div>

                  {plan.descripcion && (
                    <p className="text-sm text-muted-foreground">{plan.descripcion}</p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        )}

        {/* Informacion de restricciones */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-accent" />
            Restricciones de negocio
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Límite de perfiles:</strong> Básico: 2 perfiles, Estándar: 3 perfiles, Premium: 5 perfiles.
              Validado por trigger Oracle al crear/eliminar perfiles.
            </p>
            <p>
              <strong className="text-foreground">Cambio de plan:</strong> Si el nuevo plan tiene menos perfiles permitidos que los activos actualmente,
              el cambio es bloqueado y se muestra un mensaje indicando cuantos perfiles eliminar.
            </p>
            <p>
              <strong className="text-foreground">Planes base de datos:</strong> Los cambios aquí se actualizan en la tabla PLANES de Oracle vía API.
              El frontend consulta GET /planes para mostrar opciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
