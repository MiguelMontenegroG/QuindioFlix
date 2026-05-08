'use client'

import { useState } from 'react'
import {
  Search,
  Eye,
  RotateCcw,
  Filter,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { mockPagos, mockUsuario } from '@/lib/mock-data'
import type { Pago, EstadoPago } from '@/lib/types'

export default function PagosAdminPage() {
  const [pagos, setPagos] = useState<Pago[]>(mockPagos)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [detallePago, setDetallePago] = useState<number | null>(null)

  const filteredPagos = pagos.filter((pago) => {
    const matchesSearch = pago.referencia?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'todos' || pago.estado === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleReembolso = (id: number) => {
    if (confirm('¿Estás seguro de reembolsar este pago?')) {
      setPagos(
        pagos.map((p) =>
          p.id === id ? { ...p, estado: 'reembolsado' as EstadoPago } : p
        )
      )
    }
  }

  const stats = {
    total: pagos.reduce((sum, p) => sum + p.monto, 0),
    exitosos: pagos.filter((p) => p.estado === 'exitoso').length,
    fallidos: pagos.filter((p) => p.estado === 'fallido').length,
    reembolsados: pagos.filter((p) => p.estado === 'reembolsado').length,
  }

  const getStatusBadge = (estado: string) => {
    const styles: Record<string, string> = {
      exitoso: 'bg-green-500/20 text-green-500',
      fallido: 'bg-red-500/20 text-red-500',
      pendiente: 'bg-yellow-500/20 text-yellow-500',
      reembolsado: 'bg-blue-500/20 text-blue-500',
    }
    return styles[estado] || 'bg-muted text-muted-foreground'
  }

  const getMethodLabel = (metodo: string) => {
    const labels: Record<string, string> = {
      tarjeta_credito: 'Tarjeta de crédito',
      tarjeta_debito: 'Tarjeta débito',
      pse: 'PSE',
      efectivo: 'Efectivo',
    }
    return labels[metodo] || metodo
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Gestión de Pagos</h1>
          <p className="text-muted-foreground">
            Administra pagos, reembolsos y consulta el estado de transacciones
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Ingresos totales</p>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${stats.total.toLocaleString('es-CO')}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Exitosos</p>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.exitosos}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Fallidos</p>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500">{stats.fallidos}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Reembolsados</p>
              <RotateCcw className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-500">{stats.reembolsados}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['todos', 'exitoso', 'fallido', 'pendiente', 'reembolsado'].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status === 'todos' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Referencia</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Usuario</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Monto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Método</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPagos.map((pago) => (
                <tr key={pago.id} className="border-b border-border hover:bg-card/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-accent font-semibold">
                    {pago.referencia}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">{mockUsuario.nombre}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-foreground">
                    ${pago.monto.toLocaleString('es-CO')}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(pago.fecha).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {getMethodLabel(pago.metodo)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusBadge(pago.estado)}>
                      {pago.estado}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDetallePago(detallePago === pago.id ? null : pago.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {pago.estado === 'exitoso' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReembolso(pago.id)}
                        title="Reembolsar"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Mostrando {filteredPagos.length} de {pagos.length} pagos
        </p>

        {/* Info de soporte */}
        <div className="mt-8 bg-card/50 border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Gestión de pagos - Soporte</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Los pagos <strong className="text-red-500">fallidos</strong> requieren atención para contactar al usuario.</p>
            <p>• Los <strong className="text-blue-500">reembolsos</strong> se procesan en 3-5 días hábiles.</p>
            <p>• Los usuarios con más de 30 días sin pago se marcan como <strong className="text-yellow-500">inactivos</strong> y no pueden reproducir contenido.</p>
            <p>• El cursor de usuarios morosos permite identificar pagos pendientes masivamente.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
