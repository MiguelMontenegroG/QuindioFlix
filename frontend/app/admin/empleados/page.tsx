'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { empleadosAPI } from '@/lib/api'
import type { Empleado, Departamento, RolOracle } from '@/lib/types'

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState<string>('todos')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    departamento: 'Contenido' as Departamento,
    rol_oracle: '' as RolOracle | '',
    es_jefe_departamento: false,
  })

  const departamentos = ['Contenido', 'Soporte', 'Moderación', 'Administración']

  const cargarEmpleados = async () => {
    setIsLoading(true)
    try {
      const response = await empleadosAPI.obtenerTodos()
      if (response?.data) {
        setEmpleados(response.data)
      }
    } catch {
      console.warn('API no disponible, usando datos mock')
      const { mockEmpleados } = await import('@/lib/mock-data')
      setEmpleados(mockEmpleados as Empleado[])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarEmpleados()
  }, [])

  const filteredEmpleados = empleados.filter((emp) => {
    const matchesSearch =
      emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = filterDept === 'todos' || emp.departamento === filterDept
    return matchesSearch && matchesDept
  })

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.email) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setIsSaving(true)
    try {
      const empleadoData = {
        nombre: formData.nombre,
        email: formData.email,
        departamento: formData.departamento,
        rol_oracle: (formData.rol_oracle || undefined) as RolOracle | undefined,
        es_jefe_departamento: formData.es_jefe_departamento,
        fecha_ingreso: new Date().toISOString().split('T')[0],
      }
      if (editingId) {
        await empleadosAPI.actualizar(editingId, empleadoData)
        toast.success('Empleado actualizado correctamente')
      } else {
        await empleadosAPI.crear(empleadoData as any)
        toast.success('Empleado creado correctamente')
      }
      setShowForm(false)
      setEditingId(null)
      setFormData({ nombre: '', email: '', departamento: 'Contenido', rol_oracle: '', es_jefe_departamento: false })
      cargarEmpleados()
    } catch {
      toast.error('Error al guardar el empleado')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEliminar = async (id: number) => {
    if (!confirm('Estas seguro de eliminar este empleado?')) return
    try {
      await empleadosAPI.eliminar(id)
      toast.success('Empleado eliminado')
      cargarEmpleados()
    } catch {
      toast.error('Error al eliminar el empleado')
    }
  }

  const getDeptColor = (dept: string) => {
    const colors: Record<string, string> = {
      Contenido: 'bg-purple-500/20 text-purple-500',
      Soporte: 'bg-blue-500/20 text-blue-500',
      Moderación: 'bg-yellow-500/20 text-yellow-500',
      Administración: 'bg-green-500/20 text-green-500',
    }
    return colors[dept] || 'bg-muted text-muted-foreground'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Gestion de Empleados</h1>
            <p className="text-muted-foreground">
              Administra el equipo de QuindioFlix, departamentos y roles Oracle
            </p>
          </div>
          <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ nombre: '', email: '', departamento: 'Contenido', rol_oracle: '', es_jefe_departamento: false }) }} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo empleado
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-2">Total empleados</p>
            <p className="text-3xl font-bold text-foreground">{empleados.length}</p>
          </div>
          {departamentos.map((dept) => (
            <div key={dept} className="bg-card border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-2">{dept}</p>
              <p className="text-3xl font-bold text-foreground">
                {empleados.filter((e) => e.departamento === dept).length}
              </p>
            </div>
          ))}
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-6">
              {editingId ? 'Editar empleado' : 'Nuevo empleado'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Nombre completo</label>
                <Input
                  type="text"
                  placeholder="Nombre del empleado"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Email corporativo</label>
                <Input
                  type="email"
                  placeholder="empleado@quindioflix.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Departamento</label>
                <select
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value as Departamento })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  {departamentos.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Rol Oracle</label>
                <select
                  value={formData.rol_oracle}
                  onChange={(e) => setFormData({ ...formData, rol_oracle: e.target.value as RolOracle })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  <option value="">Sin asignar</option>
                  <option value="ROL_ADMIN">Administrador</option>
                  <option value="ROL_ANALISTA">Analista</option>
                  <option value="ROL_SOPORTE">Soporte</option>
                  <option value="ROL_CONTENIDO">Contenido</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="jefe"
                  checked={formData.es_jefe_departamento}
                  onChange={(e) => setFormData({ ...formData, es_jefe_departamento: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="jefe" className="text-sm text-foreground cursor-pointer">
                  Es jefe de departamento
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : (editingId ? 'Guardar cambios' : 'Crear empleado')}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null) }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-md text-foreground"
          >
            <option value="todos">Todos los departamentos</option>
            {departamentos.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Tabla */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Empleado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Departamento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Rol Oracle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Jefe</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Ingreso</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmpleados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No se encontraron empleados
                  </td>
                </tr>
              ) : (
                filteredEmpleados.map((emp) => (
                  <tr key={emp.id} className="border-b border-border hover:bg-card/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-foreground">{emp.nombre}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getDeptColor(emp.departamento)}>
                        {emp.departamento}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {emp.rol_oracle ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/20 text-accent rounded text-xs font-semibold">
                          <Shield className="w-3 h-3" />
                          {emp.rol_oracle}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {emp.es_jefe_departamento ? (
                        <span className="text-green-500 text-sm font-semibold">Si</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {emp.fecha_ingreso ? new Date(emp.fecha_ingreso).toLocaleDateString('es-CO') : '-'}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingId(emp.id)
                        setFormData({
                          nombre: emp.nombre,
                          email: emp.email,
                          departamento: emp.departamento,
                          rol_oracle: emp.rol_oracle || '',
                          es_jefe_departamento: emp.es_jefe_departamento,
                        })
                        setShowForm(true)
                      }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEliminar(emp.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Mostrando {filteredEmpleados.length} de {empleados.length} empleados
        </p>
      </div>
    </div>
  )
}
