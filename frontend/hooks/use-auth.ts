'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import type { Usuario, Perfil, SessionData } from '@/lib/types'

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

  // Cargar sesión desde localStorage al montar
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
    
    setToken(response.token)
    setUsuario(response.usuario)
    setPerfiles(response.perfiles)

    localStorage.setItem('token', response.token)
    localStorage.setItem('usuario', JSON.stringify(response.usuario))

    // Redirigir a selección de perfiles
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
      setUsuario(response.usuario)
      setPerfiles(response.perfiles)
    } catch {
      // Si el token expiró, cerrar sesión
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

// Guard para proteger rutas que requieren autenticación
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
