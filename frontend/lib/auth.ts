'use client'

import type { Usuario, Perfil } from './types'

// ============================================
// Manejo de sesión en el frontend
// ============================================

const TOKEN_KEY = 'token'
const USUARIO_KEY = 'usuario'
const PERFIL_ACTIVO_KEY = 'perfilActivo'

/**
 * Obtiene el token JWT del localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Guarda el token JWT en localStorage
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Elimina el token JWT
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Obtiene el usuario almacenado
 */
export function getUsuario(): Usuario | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(USUARIO_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * Guarda el usuario en localStorage
 */
export function setUsuario(usuario: Usuario): void {
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario))
}

/**
 * Obtiene el perfil activo
 */
export function getPerfilActivo(): Perfil | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(PERFIL_ACTIVO_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * Guarda el perfil activo
 */
export function setPerfilActivo(perfil: Perfil): void {
  localStorage.setItem(PERFIL_ACTIVO_KEY, JSON.stringify(perfil))
}

/**
 * Elimina el perfil activo
 */
export function removePerfilActivo(): void {
  localStorage.removeItem(PERFIL_ACTIVO_KEY)
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  return !!getToken() && !!getUsuario()
}

/**
 * Cierra la sesión completamente
 */
export function logout(): void {
  removeToken()
  removePerfilActivo()
  localStorage.removeItem(USUARIO_KEY)
}

/**
 * Verifica si el perfil activo es infantil
 */
export function isPerfilInfantil(): boolean {
  const perfil = getPerfilActivo()
  return perfil?.es_infantil ?? false
}

/**
 * Decodifica un JWT para obtener el payload (sin verificar firma)
 * Solo para propósitos de UI, la verificación real se hace en backend
 */
export function decodeToken(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Verifica si el token ha expirado
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload || !payload.exp) return true
  return Date.now() >= payload.exp * 1000
}
