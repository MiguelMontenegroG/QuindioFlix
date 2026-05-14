'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import type { Usuario, Perfil } from '@/lib/types'

// Funciones de mapeo backend -> frontend
function mapUsuario(backendUser: any): {
  id: any;
  nombre: any;
  email: any;
  telefono: any;
  ciudad: any;
  fecha_nacimiento: any;
  id_plan: any;
  estado: "activo" | "inactivo";
  codigo_referido: any;
  fecha_registro: any;
  es_admin: any;
  rol_oracle: any
} {
  return {
    id: backendUser.id_usuario ?? backendUser.id,
    nombre: backendUser.nombre,
    email: backendUser.email,
    telefono: backendUser.telefono,
    ciudad: backendUser.ciudad,
    fecha_nacimiento: backendUser.fecha_nacimiento,
    id_plan: backendUser.id_plan,
    estado: (backendUser.estado_cuenta || backendUser.estado || 'activo').toLowerCase() as 'activo' | 'inactivo',
    codigo_referido: backendUser.codigo_referido,
    fecha_registro: backendUser.fecha_registro,
    es_admin: backendUser.es_admin || backendUser.es_admin === 'S',
    rol_oracle: backendUser.rol_oracle,
  }
}

function mapPerfil(backendPerfil: any): Perfil {
  return {
    id: backendPerfil.id_perfil ?? backendPerfil.id,
    id_usuario: backendPerfil.id_usuario,
    nombre: backendPerfil.nombre_perfil ?? backendPerfil.nombre,
    avatar: backendPerfil.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(backendPerfil.nombre_perfil || backendPerfil.nombre || 'U')}`,
    es_infantil: (backendPerfil.tipo === 'INFANTIL') || !!backendPerfil.es_infantil,
    pin: backendPerfil.pin,
  }
}

interface AuthContextType {
  usuario: Usuario | null
  perfiles: Perfil[]
  perfilActivo: Perfil | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setPerfilActivo: (perfil: Perfil) => void
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [perfilActivo, setPerfilActivoState] = useState<Perfil | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUsuario = localStorage.getItem('usuario')
    const storedPerfil = localStorage.getItem('perfilActivo')

    if (storedToken && storedUsuario) {
      setToken(storedToken)
      setUsuario(JSON.parse(storedUsuario))
      if (storedPerfil) {
        setPerfilActivoState(JSON.parse(storedPerfil))
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authAPI.login(email, password)

    const usuarioMapeado = mapUsuario(response.usuario)
    const perfilesMapeados = (response.perfiles || []).map(mapPerfil)

    setToken(response.token)
    setUsuario(usuarioMapeado)
    setPerfiles(perfilesMapeados)

    localStorage.setItem('token', response.token)
    localStorage.setItem('usuario', JSON.stringify(usuarioMapeado))

    router.push('/perfiles')
  }, [router])

  const logout = useCallback(() => {
    setUsuario(null)
    setPerfiles([])
    setPerfilActivoState(null)
    setToken(null)

    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    localStorage.removeItem('perfilActivo')

    router.push('/login')
  }, [router])

  const setPerfilActivo = useCallback((perfil: Perfil) => {
    setPerfilActivoState(perfil)
    localStorage.setItem('perfilActivo', JSON.stringify(perfil))
    router.push('/inicio')
  }, [router])

  const refreshSession = useCallback(async () => {
    try {
      const response = await authAPI.verificarToken()
      const usuarioMapeado = mapUsuario(response.usuario)
      const perfilesMapeados = (response.perfiles || []).map(mapPerfil)
      setUsuario(usuarioMapeado)
      setPerfiles(perfilesMapeados)
      localStorage.setItem('usuario', JSON.stringify(usuarioMapeado))
    } catch {
      logout()
    }
  }, [logout])

  return (
    <AuthContext.Provider
      value={{
        usuario,
        perfiles,
        perfilActivo,
        token,
        isAuthenticated: !!token && !!usuario,
        isLoading,
        login,
        logout,
        setPerfilActivo,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}

export function useAuthGuard() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  return { isAuthenticated, isLoading }
}
