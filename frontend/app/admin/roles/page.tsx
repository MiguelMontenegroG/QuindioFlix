'use client'

import { useState, useRef } from 'react'
import {
  Terminal,
  Play,
  RotateCcw,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  Database,
  Table2,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { dbaAPI } from '@/lib/api'

// ----------------------------------------------------------------
// Consultas predefinidas organizadas por modulo
// ----------------------------------------------------------------
interface ConsultaPredefinida {
  titulo: string
  descripcion: string
  sql: string
}

interface CategoriaConsultas {
  nombre: string
  icono: string
  consultas: ConsultaPredefinida[]
}

const CONSULTAS_PREDEFINIDAS: CategoriaConsultas[] = [
  {
    nombre: 'Empleados y Departamentos',
    icono: '',
    consultas: [
      {
        titulo: 'Todos los empleados con departamento',
        descripcion: 'Lista completa con nombre, email, cargo, departamento y supervisor',
        sql: `SELECT e.id_empleado, e.nombre, e.email, e.cargo, d.nombre_depto, sup.nombre AS supervisor
FROM C##QUINDIOFLIX.EMPLEADOS e
JOIN C##QUINDIOFLIX.DEPARTAMENTOS d ON d.id_departamento = e.id_departamento
LEFT JOIN C##QUINDIOFLIX.EMPLEADOS sup ON sup.id_empleado = e.id_supervisor
ORDER BY e.nombre`,
      },
      {
        titulo: 'Empleados por departamento (conteo)',
        descripcion: 'Cuantos empleados hay en cada departamento',
        sql: `SELECT d.nombre_depto, COUNT(*) AS total_empleados
FROM C##QUINDIOFLIX.EMPLEADOS e
JOIN C##QUINDIOFLIX.DEPARTAMENTOS d ON d.id_departamento = e.id_departamento
GROUP BY d.nombre_depto
ORDER BY total_empleados DESC`,
      },
      {
        titulo: 'Jefes de departamento',
        descripcion: 'Quien lidera cada departamento',
        sql: `SELECT d.nombre_depto, e.nombre AS jefe, e.email, e.cargo
FROM C##QUINDIOFLIX.DEPARTAMENTOS d
JOIN C##QUINDIOFLIX.EMPLEADOS e ON e.id_empleado = d.id_jefe
ORDER BY d.nombre_depto`,
      },
      {
        titulo: 'Jerarquia de supervision',
        descripcion: 'Empleados que supervisan a otros',
        sql: `SELECT sup.nombre AS supervisor, sup.cargo AS cargo_supervisor,
  COUNT(e.id_empleado) AS supervisados
FROM C##QUINDIOFLIX.EMPLEADOS sup
JOIN C##QUINDIOFLIX.EMPLEADOS e ON e.id_supervisor = sup.id_empleado
GROUP BY sup.nombre, sup.cargo
ORDER BY supervisados DESC`,
      },
    ],
  },
  {
    nombre: 'Contenido',
    icono: '',
    consultas: [
      {
        titulo: 'Top 10 contenido mas visto',
        descripcion: 'Contenido con mas reproducciones registradas',
        sql: `SELECT c.titulo, cat.nombre_categoria, COUNT(r.id_reproduccion) AS reproducciones
FROM C##QUINDIOFLIX.CONTENIDO c
JOIN C##QUINDIOFLIX.CATEGORIAS cat ON cat.id_categoria = c.id_categoria
LEFT JOIN C##QUINDIOFLIX.REPRODUCCIONES r ON r.id_contenido = c.id_contenido
GROUP BY c.titulo, cat.nombre_categoria
ORDER BY reproducciones DESC
FETCH FIRST 10 ROWS ONLY`,
      },
      {
        titulo: 'Contenido por categoria',
        descripcion: 'Total de contenido agrupado por categoria',
        sql: `SELECT cat.nombre_categoria, COUNT(*) AS total
FROM C##QUINDIOFLIX.CONTENIDO c
JOIN C##QUINDIOFLIX.CATEGORIAS cat ON cat.id_categoria = c.id_categoria
GROUP BY cat.nombre_categoria
ORDER BY total DESC`,
      },
      {
        titulo: 'Contenido con mejor calificacion',
        descripcion: 'Top 15 contenido mejor calificado',
        sql: `SELECT c.titulo, cat.nombre_categoria,
  ROUND(AVG(cal.estrellas), 2) AS promedio_estrellas,
  COUNT(cal.id_calificacion) AS votos
FROM C##QUINDIOFLIX.CONTENIDO c
JOIN C##QUINDIOFLIX.CATEGORIAS cat ON cat.id_categoria = c.id_categoria
JOIN C##QUINDIOFLIX.CALIFICACIONES cal ON cal.id_contenido = c.id_contenido
GROUP BY c.titulo, cat.nombre_categoria
HAVING COUNT(cal.id_calificacion) >= 2
ORDER BY promedio_estrellas DESC
FETCH FIRST 15 ROWS ONLY`,
      },
      {
        titulo: 'Series con temporadas y episodios',
        descripcion: 'Todas las series con su numero de temporadas y episodios totales',
        sql: `SELECT c.titulo, COUNT(DISTINCT t.id_temporada) AS temporadas,
  COUNT(e.id_episodio) AS episodios_totales
FROM C##QUINDIOFLIX.CONTENIDO c
JOIN C##QUINDIOFLIX.TEMPORADAS t ON t.id_contenido = c.id_contenido
LEFT JOIN C##QUINDIOFLIX.EPISODIOS e ON e.id_temporada = t.id_temporada
GROUP BY c.titulo
ORDER BY temporadas DESC, episodios_totales DESC`,
      },
      {
        titulo: 'Contenido por genero',
        descripcion: 'Cuantos titulos tiene cada genero',
        sql: `SELECT g.nombre_genero, COUNT(*) AS total_titulos
FROM C##QUINDIOFLIX.CONTENIDO_GENERO cg
JOIN C##QUINDIOFLIX.GENEROS g ON g.id_genero = cg.id_genero
GROUP BY g.nombre_genero
ORDER BY total_titulos DESC`,
      },
    ],
  },
  {
    nombre: 'Usuarios y Perfiles',
    icono: '',
    consultas: [
      {
        titulo: 'Usuarios activos vs inactivos',
        descripcion: 'Estado de las cuentas de usuario',
        sql: `SELECT estado_cuenta, COUNT(*) AS total
FROM C##QUINDIOFLIX.USUARIOS
GROUP BY estado_cuenta
ORDER BY total DESC`,
      },
      {
        titulo: 'Usuarios por plan',
        descripcion: 'Distribucion de usuarios en cada plan',
        sql: `SELECT p.nombre_plan, COUNT(u.id_usuario) AS total_usuarios
FROM C##QUINDIOFLIX.USUARIOS u
JOIN C##QUINDIOFLIX.PLANES p ON p.id_plan = u.id_plan
GROUP BY p.nombre_plan
ORDER BY total_usuarios DESC`,
      },
      {
        titulo: 'Perfiles por usuario',
        descripcion: 'Usuarios con mas perfiles creados',
        sql: `SELECT u.nombre, u.email, COUNT(p.id_perfil) AS total_perfiles
FROM C##QUINDIOFLIX.USUARIOS u
JOIN C##QUINDIOFLIX.PERFILES p ON p.id_usuario = u.id_usuario
GROUP BY u.nombre, u.email
ORDER BY total_perfiles DESC`,
      },
      {
        titulo: 'Usuarios registrados ultimos 30 dias',
        descripcion: 'Nuevos registros en el ultimo mes',
        sql: `SELECT u.nombre, u.email, p.nombre_plan, u.fecha_registro
FROM C##QUINDIOFLIX.USUARIOS u
JOIN C##QUINDIOFLIX.PLANES p ON p.id_plan = u.id_plan
WHERE u.fecha_registro >= SYSDATE - 30
ORDER BY u.fecha_registro DESC`,
      },
    ],
  },
  {
    nombre: 'Planes y Pagos',
    icono: '',
    consultas: [
      {
        titulo: 'Ingresos totales por plan',
        descripcion: 'Suma de pagos exitosos agrupados por plan',
        sql: `SELECT p.nombre_plan, COUNT(pg.id_pago) AS total_pagos,
  SUM(pg.monto) AS ingresos_totales
FROM C##QUINDIOFLIX.PAGOS pg
JOIN C##QUINDIOFLIX.USUARIOS u ON u.id_usuario = pg.id_usuario
JOIN C##QUINDIOFLIX.PLANES p ON p.id_plan = u.id_plan
WHERE pg.estado_pago = 'EXITOSO'
GROUP BY p.nombre_plan
ORDER BY ingresos_totales DESC`,
      },
      {
        titulo: 'Pagos del mes actual',
        descripcion: 'Pagos realizados en el mes en curso',
        sql: `SELECT u.nombre, u.email, pg.monto, pg.metodo_pago, pg.estado_pago, pg.fecha_pago
FROM C##QUINDIOFLIX.PAGOS pg
JOIN C##QUINDIOFLIX.USUARIOS u ON u.id_usuario = pg.id_usuario
WHERE EXTRACT(MONTH FROM pg.fecha_pago) = EXTRACT(MONTH FROM SYSDATE)
  AND EXTRACT(YEAR FROM pg.fecha_pago) = EXTRACT(YEAR FROM SYSDATE)
ORDER BY pg.fecha_pago DESC`,
      },
      {
        titulo: 'Pagos fallidos recientes',
        descripcion: 'Usuarios con pagos fallidos en los ultimos 60 dias',
        sql: `SELECT u.nombre, u.email, pg.monto, pg.metodo_pago, pg.fecha_pago
FROM C##QUINDIOFLIX.PAGOS pg
JOIN C##QUINDIOFLIX.USUARIOS u ON u.id_usuario = pg.id_usuario
WHERE pg.estado_pago = 'FALLIDO'
  AND pg.fecha_pago >= SYSDATE - 60
ORDER BY pg.fecha_pago DESC`,
      },
    ],
  },
  {
    nombre: 'Reproducciones',
    icono: '',
    consultas: [
      {
        titulo: 'Reproducciones por dispositivo',
        descripcion: 'Desde que dispositivos se reproduce mas contenido',
        sql: `SELECT dispositivo, COUNT(*) AS total_reproducciones
FROM C##QUINDIOFLIX.REPRODUCCIONES
GROUP BY dispositivo
ORDER BY total_reproducciones DESC`,
      },
      {
        titulo: 'Horas totales de reproduccion por perfil',
        descripcion: 'Suma de duracion reproducida por cada perfil (en horas)',
        sql: `SELECT p.nombre_perfil AS perfil, u.nombre AS usuario,
  ROUND(SUM(r.porcentaje_avance * c.duracion / 100) / 3600, 2) AS horas_reproducidas
FROM C##QUINDIOFLIX.REPRODUCCIONES r
JOIN C##QUINDIOFLIX.PERFILES p ON p.id_perfil = r.id_perfil
JOIN C##QUINDIOFLIX.USUARIOS u ON u.id_usuario = p.id_usuario
JOIN C##QUINDIOFLIX.CONTENIDO c ON c.id_contenido = r.id_contenido
WHERE r.fecha_hora_fin IS NOT NULL
GROUP BY p.nombre, u.nombre
ORDER BY horas_reproducidas DESC
FETCH FIRST 10 ROWS ONLY`,
      },
      {
        titulo: 'Contenido mas reproducido (top 10)',
        descripcion: 'Ranking de contenido por volumen de reproducciones',
        sql: `SELECT c.titulo, cat.nombre_categoria, COUNT(r.id_reproduccion) AS reproducciones
FROM C##QUINDIOFLIX.REPRODUCCIONES r
JOIN C##QUINDIOFLIX.CONTENIDO c ON c.id_contenido = r.id_contenido
JOIN C##QUINDIOFLIX.CATEGORIAS cat ON cat.id_categoria = c.id_categoria
GROUP BY c.titulo, cat.nombre_categoria
ORDER BY reproducciones DESC
FETCH FIRST 10 ROWS ONLY`,
      },
    ],
  },
  {
    nombre: 'Reportes y Moderacion',
    icono: '',
    consultas: [
      {
        titulo: 'Reportes pendientes',
        descripcion: 'Contenido reportado que aun no ha sido revisado',
        sql: `SELECT r.id_reporte, r.motivo, c.titulo AS contenido_reportado,
  u.nombre AS reportador, r.fecha_reporte
FROM C##QUINDIOFLIX.REPORTES r
JOIN C##QUINDIOFLIX.CONTENIDO c ON c.id_contenido = r.id_contenido
JOIN C##QUINDIOFLIX.PERFILES p ON p.id_perfil = r.id_perfil_reportador
JOIN C##QUINDIOFLIX.USUARIOS u ON u.id_usuario = p.id_usuario
WHERE r.estado_reporte = 'PENDIENTE'
ORDER BY r.fecha_reporte ASC`,
      },
      {
        titulo: 'Top 5 reportadores',
        descripcion: 'Usuarios que mas reportes han hecho',
        sql: `SELECT u.nombre, u.email, COUNT(r.id_reporte) AS total_reportes
FROM C##QUINDIOFLIX.REPORTES r
JOIN C##QUINDIOFLIX.PERFILES p ON p.id_perfil = r.id_perfil_reportador
JOIN C##QUINDIOFLIX.USUARIOS u ON u.id_usuario = p.id_usuario
GROUP BY u.nombre, u.email
ORDER BY total_reportes DESC
FETCH FIRST 5 ROWS ONLY`,
      },
      {
        titulo: 'Reportes resueltos con moderador',
        descripcion: 'Historial de resoluciones con comentarios',
        sql: `SELECT r.id_reporte, r.motivo, c.titulo,
  u.nombre AS moderador, r.comentario_moderador, r.fecha_resolucion
FROM C##QUINDIOFLIX.REPORTES r
JOIN C##QUINDIOFLIX.CONTENIDO c ON c.id_contenido = r.id_contenido
JOIN C##QUINDIOFLIX.USUARIOS u ON u.id_usuario = r.id_moderador
WHERE r.estado_reporte IN ('RESUELTO', 'RECHAZADO')
ORDER BY r.fecha_resolucion DESC`,
      },
    ],
  },
  {
    nombre: 'Esquema y DBA',
    icono: '',
    consultas: [
      {
        titulo: 'Tablas del esquema',
        descripcion: 'Todas las tablas en el esquema QUINDIOFLIX',
        sql: `SELECT table_name, num_rows, last_analyzed
FROM all_tables
WHERE owner = 'C##QUINDIOFLIX'
ORDER BY table_name`,
      },
      {
        titulo: 'Vistas materializadas',
        descripcion: 'Vistas materializadas disponibles',
        sql: `SELECT mview_name, refresh_mode, last_refresh_type,
  TO_CHAR(last_refresh_date, 'YYYY-MM-DD HH24:MI:SS') AS ultimo_refresh,
  status, num_rows
FROM user_mviews
ORDER BY mview_name`,
      },
      {
        titulo: 'Indices por tabla',
        descripcion: 'Indices creados en cada tabla del esquema',
        sql: `SELECT table_name, index_name, uniqueness, status
FROM user_indexes
ORDER BY table_name, index_name`,
      },
      {
        titulo: 'Constraints (FKs)',
        descripcion: 'Claves foraneas del esquema',
        sql: `SELECT a.table_name, a.column_name, a.constraint_name,
  c_pk.table_name AS referenced_table
FROM user_cons_columns a
JOIN user_constraints b ON a.constraint_name = b.constraint_name
JOIN user_constraints c_pk ON b.r_constraint_name = c_pk.constraint_name
WHERE b.constraint_type = 'R'
ORDER BY a.table_name, a.constraint_name`,
      },
      {
        titulo: 'Tablespaces y uso',
        descripcion: 'Espacio usado y disponible en tablespaces',
        sql: `SELECT df.tablespace_name,
  ROUND(df.bytes / 1024 / 1024, 2) AS tamanio_mb,
  ROUND((df.bytes - fs.bytes) / 1024 / 1024, 2) AS usado_mb,
  ROUND(fs.bytes / 1024 / 1024, 2) AS libre_mb,
  ROUND((df.bytes - fs.bytes) * 100 / df.bytes, 2) AS porcentaje_usado
FROM (SELECT tablespace_name, SUM(bytes) bytes FROM dba_data_files GROUP BY tablespace_name) df
JOIN (SELECT tablespace_name, SUM(bytes) bytes FROM dba_free_space GROUP BY tablespace_name) fs
  ON fs.tablespace_name = df.tablespace_name
ORDER BY df.tablespace_name`,
      },
      {
        titulo: 'Transacciones activas',
        descripcion: 'Sesiones activas en la base de datos',
        sql: `SELECT s.sid, s.serial#, s.username, s.status,
  s.osuser, s.machine, s.program,
  TO_CHAR(s.logon_time, 'YYYY-MM-DD HH24:MI:SS') AS logon_time
FROM v$session s
WHERE s.username IS NOT NULL
  AND s.status = 'ACTIVE'
  AND s.type != 'BACKGROUND'
ORDER BY s.logon_time`,
      },
    ],
  },
  {
    nombre: 'Analitica y Negocio',
    icono: '',
    consultas: [
      {
        titulo: 'Consumo por ciudad',
        descripcion: 'Reproducciones totales agrupadas por ciudad del usuario',
        sql: `SELECT u.ciudad, COUNT(r.id_reproduccion) AS reproducciones
FROM C##QUINDIOFLIX.REPRODUCCIONES r
JOIN C##QUINDIOFLIX.PERFILES p ON p.id_perfil = r.id_perfil
JOIN C##QUINDIOFLIX.USUARIOS u ON u.id_usuario = p.id_usuario
GROUP BY u.ciudad
ORDER BY reproducciones DESC`,
      },
      {
        titulo: 'Metodo de pago preferido',
        descripcion: 'Que metodos de pago usan mas los usuarios',
        sql: `SELECT metodo_pago, COUNT(*) AS total_uso, SUM(monto) AS monto_total
FROM C##QUINDIOFLIX.PAGOS
WHERE estado_pago = 'EXITOSO'
GROUP BY metodo_pago
ORDER BY total_uso DESC`,
      },
      {
        titulo: 'Usuarios con referidos',
        descripcion: 'Usuarios que han sido referidos por otro usuario',
        sql: `SELECT u.nombre AS referidor, COUNT(r.id_usuario) AS referidos
FROM C##QUINDIOFLIX.USUARIOS u
JOIN C##QUINDIOFLIX.USUARIOS r ON r.id_referidor = u.id_usuario
GROUP BY u.nombre
ORDER BY referidos DESC`,
      },
    ],
  },
]

// ----------------------------------------------------------------
// Componente principal
// ----------------------------------------------------------------
export default function RolesPage() {
  // Estado de la terminal
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<{ columns: string[]; rows: Record<string, any>[]; total: number; mostrando: number } | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tiempoEjecucion, setTiempoEjecucion] = useState<number | null>(null)

  // Estado de las categorias (acordeon)
  const [categoriasAbiertas, setCategoriasAbiertas] = useState<Record<number, boolean>>({})

  // Copiar al portapapeles
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resultadosRef = useRef<HTMLDivElement>(null)

  const toggleCategoria = (idx: number) => {
    setCategoriasAbiertas((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const seleccionarConsulta = (sql: string) => {
    setQuery(sql)
    setError(null)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const copiarConsulta = async (sql: string, id: string) => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      if (textareaRef.current) {
        textareaRef.current.value = sql
        textareaRef.current.select()
      }
    }
  }

  const ejecutar = async () => {
    const trimmed = query.trim()
    if (!trimmed) {
      toast.warning('Escribe una consulta SQL')
      return
    }

    if (!trimmed.toUpperCase().startsWith('SELECT')) {
      toast.error('Solo se permiten consultas SELECT')
      return
    }

    setIsExecuting(true)
    setError(null)
    setResultados(null)
    setTiempoEjecucion(null)

    const inicio = performance.now()
    try {
      const data = await dbaAPI.ejecutarQuery(trimmed, 500)
      const fin = performance.now()
      setTiempoEjecucion(Math.round(fin - inicio))
      setResultados(data)
      setTimeout(() => {
        resultadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar la consulta')
      toast.error(err.message || 'Error al ejecutar la consulta')
    } finally {
      setIsExecuting(false)
    }
  }

  const limpiar = () => {
    setQuery('')
    setResultados(null)
    setError(null)
    setTiempoEjecucion(null)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      ejecutar()
    }
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Terminal SQL</h1>
          <p className="text-muted-foreground">
            Consola de consultas SQL sobre Oracle. Selecciona una consulta predefinida o escribe tu propio SELECT.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Columna izquierda: Consultas predefinidas */}
          <div className="xl:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Consultas predefinidas
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Haz clic en una consulta para copiarla a la terminal
              </p>

              <div className="space-y-2">
                {CONSULTAS_PREDEFINIDAS.map((categoria, idx) => (
                  <div key={idx} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategoria(idx)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-accent/10 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span>{categoria.icono}</span>
                        <span>{categoria.nombre}</span>
                      </span>
                      {categoriasAbiertas[idx] ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>

                    {categoriasAbiertas[idx] && (
                      <div className="border-t border-border">
                        {categoria.consultas.map((consulta, cidx) => (
                          <div
                            key={cidx}
                            className="px-3 py-2.5 hover:bg-accent/5 transition-colors border-b border-border/50 last:border-b-0"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <button
                                onClick={() => seleccionarConsulta(consulta.sql)}
                                className="flex-1 text-left"
                              >
                                <p className="text-sm font-medium text-foreground">{consulta.titulo}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{consulta.descripcion}</p>
                              </button>
                              <button
                                onClick={() => copiarConsulta(consulta.sql, `${idx}-${cidx}`)}
                                className="flex-shrink-0 p-1 hover:bg-accent/10 rounded transition-colors"
                                title="Copiar SQL"
                              >
                                {copiedId === `${idx}-${cidx}` ? (
                                  <Check className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna derecha: Terminal + Resultados */}
          <div className="xl:col-span-2 space-y-6">
            {/* Terminal */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Barra de la terminal */}
              <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-accent" />
                  <span className="text-sm font-semibold text-foreground">SQL Terminal</span>
                </div>
                <span className="text-xs text-muted-foreground">Ctrl + Enter para ejecutar</span>
              </div>

              {/* Editor */}
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setError(null)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu consulta SELECT aqui..."
                className="w-full bg-background text-foreground font-mono text-sm p-4 min-h-[180px] resize-y border-none outline-none placeholder:text-muted-foreground/50"
                spellCheck={false}
              />

              {/* Barra de acciones */}
              <div className="bg-muted/50 px-4 py-2.5 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={ejecutar}
                    disabled={isExecuting || !query.trim()}
                    className="gap-2"
                    size="sm"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Ejecutando...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Ejecutar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={limpiar}
                    disabled={isExecuting}
                    size="sm"
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Limpiar
                  </Button>
                </div>

                {query.trim() && !query.trim().toUpperCase().startsWith('SELECT') && (
                  <div className="flex items-center gap-1.5 text-xs text-yellow-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Solo SELECT
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-500 mb-1">Error en la consulta</p>
                  <p className="text-sm text-red-400/80 font-mono">{error}</p>
                </div>
              </div>
            )}

            {/* Resultados */}
            {resultados && (
              <div ref={resultadosRef} className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Barra de info */}
                <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-foreground">Resultados</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Table2 className="w-3.5 h-3.5" />
                      {resultados.mostrando} de {resultados.total} filas
                    </span>
                    {tiempoEjecucion !== null && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {tiempoEjecucion} ms
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {resultados.columns.length} columnas
                  </span>
                </div>

                {/* Tabla de resultados */}
                {resultados.rows.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Database className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p>La consulta no devolvio resultados</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-card z-10">
                        <tr className="border-b border-border">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground bg-muted/30 whitespace-nowrap">
                            #
                          </th>
                          {resultados.columns.map((col, i) => (
                            <th
                              key={i}
                              className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground bg-muted/30 whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resultados.rows.map((row, ri) => (
                          <tr
                            key={ri}
                            className="border-b border-border/50 hover:bg-accent/5 transition-colors"
                          >
                            <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                              {ri + 1}
                            </td>
                            {resultados.columns.map((col, ci) => (
                              <td
                                key={ci}
                                className="px-4 py-2.5 text-sm text-foreground whitespace-nowrap max-w-[300px] overflow-hidden text-ellipsis"
                                title={String(row[col] ?? '')}
                              >
                                {row[col] !== null && row[col] !== undefined ? String(row[col]) : (
                                  <span className="text-muted-foreground/50 italic">NULL</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pie con totales */}
                {resultados.total > resultados.mostrando && (
                  <div className="bg-muted/30 px-4 py-2.5 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                      Mostrando las primeras {resultados.mostrando} filas de {resultados.total} totales.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Estado vacio */}
            {!resultados && !error && (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <Terminal className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Listo para consultar</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Selecciona una consulta predefinida del panel izquierdo o escribe tu propio
                  SELECT en la terminal y presiona Ctrl+Enter para ejecutar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}