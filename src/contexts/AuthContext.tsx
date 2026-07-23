import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import api from '@/config/api'
import type { User } from '@/types'
import { Role } from '@/types'

interface JwtPayload {
  sub: string
  ci: string
  roles: Role[]
  sedeId: string | null
  sedePnfId: string | null
  iat: number
  exp: number
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (ci: string, password: string) => Promise<string | null>
  logout: () => void
}

function parseJwt(token: string): JwtPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    const token = localStorage.getItem('sigu_token')
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false })
      return
    }

    const payload = parseJwt(token)
    if (!payload || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('sigu_token')
      localStorage.removeItem('sigu_user')
      setState({ user: null, isLoading: false, isAuthenticated: false })
      return
    }

    api
      .get('/users/me')
      .then((res) => {
        setState({ user: res.data, isLoading: false, isAuthenticated: true })
      })
      .catch(() => {
        localStorage.removeItem('sigu_token')
        setState({ user: null, isLoading: false, isAuthenticated: false })
      })
  }, [])

  const login = useCallback(async (ci: string, password: string): Promise<string | null> => {
    try {
      const normalizedCi = ci
        .trim()
        .toUpperCase()
        .replace(/^(\d)/, 'V-$1')
      const res = await api.post('/auth/login', { ci: normalizedCi, password, clientType: 'WEB' })
      const { accessToken } = res.data

      localStorage.setItem('sigu_token', accessToken)

      const userRes = await api.get('/users/me')
      localStorage.setItem('sigu_user', JSON.stringify(userRes.data))

      setState({ user: userRes.data, isLoading: false, isAuthenticated: true })
      return null
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Error de conexión'
      return message
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sigu_token')
    localStorage.removeItem('sigu_user')
    setState({ user: null, isLoading: false, isAuthenticated: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
