'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { empleadosAPI, departamentosAPI } from '@/lib/api'
import type { Empleado } from '@/lib/types'

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState<string>('todos')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [departamentos, setDepartamentos] = useState<Array<{ id_departamento: number; nombre_depto: string }>>([])

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    cargo: '',
    id_departamento: 0,
    id_supervisor: null as number | null,
  })

  const cargarEmpleados = async () => {
    setIsLoading(true)
    try {
      const response = await empleadosAPI.obtenerTodos()
      if (response?.data) {
        setEmpleados(response.data)
      }
    } catch {
      console.warn('API no disponible')
      setEmpleados([])
    } finally {
      setIsLoading(false)
    }
  }

  const cargarDepartamentos = async () => {
    try {
      const data = await departamentosAPI.obtenerTodos()
      const normalizados = data.map((d: any) => ({
        id_departamento: d.id_departamento ?? d.ID_DEPARTAMENTO,
        nombre_depto: d.nombre_depto ?? d.NOMBRE_DEPTO,
      }))
      setDepartamentos(normalizados)
      if (normalizados.length > 0 && formData.id_departamento === 0) {
        setFormData((prev) => ({ ...prev, id_departamento: normalizados[0].id_departamento }))
      }
    } catch {
      console.warn('No se pudieron cargar departamentos')
    }
  }

  useEffect(() => {
    cargarEmpleados()
    cargarDepartamentos()
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
        cargo: formData.cargo,
        id_departamento: formData.id_departamento,
        id_supervisor: formData.id_supervisor,
        fecha_contratacion: new Date().toISOString().split('T')[0],
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
      setFormData({ nombre: '', email: '', cargo: '', id_departamento: departamentos[0]?.id_departamento || 0, id_supervisor: null })
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
          <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ nombre: '', email: '', cargo: '', id_departamento: departamentos[0]?.id_departamento || 0, id_supervisor: null }) }} className="gap-2">
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
            <div key={dept.id_departamento} className="bg-card border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-2">{dept.nombre_depto}</p>
              <p className="text-3xl font-bold text-foreground">
                {empleados.filter((e) => e.departamento === dept.nombre_depto).length}
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
                <label className="block text-sm font-semibold text-foreground mb-2">Cargo</label>
                <Input
                  type="text"
                  placeholder="Cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Departamento</label>
                <select
                  value={formData.id_departamento}
                  onChange={(e) => setFormData({ ...formData, id_departamento: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  {departamentos.map((d) => (
                    <option key={d.id_departamento} value={d.id_departamento}>{d.nombre_depto}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Supervisor</label>
                <select
                  value={formData.id_supervisor ?? ''}
                  onChange={(e) => setFormData({ ...formData, id_supervisor: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  <option value="">Sin supervisor</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                  ))}
                </select>
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
              <option key={d.id_departamento} value={d.nombre_depto}>{d.nombre_depto}</option>
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Cargo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Supervisor</th>
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
                      <Badge className={getDeptColor(emp.departamento || '')}>
                        {emp.departamento || '-'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-muted-foreground">{emp.cargo || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-muted-foreground">{emp.supervisor || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {emp.fecha_contratacion ? new Date(emp.fecha_contratacion).toLocaleDateString('es-CO') : '-'}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingId(emp.id)
                        setFormData({
                          nombre: emp.nombre,
                          email: emp.email,
                          cargo: emp.cargo || '',
                          id_departamento: emp.id_departamento || departamentos[0]?.id_departamento || 0,
                          id_supervisor: emp.id_supervisor ?? null,
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
