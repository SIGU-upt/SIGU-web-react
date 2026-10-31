import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import api from '@/config/api'
import { getErrorMessage } from '@/lib/errors'
import type { User } from '@/types'
import { Role } from '@/types'

const IDLE_TIMEOUT_MS = 30 * 60 * 1000
const IDLE_WARNING_MS = 25 * 60 * 1000
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'] as const
// mousemove se dispara decenas de veces por segundo: se reinician los temporizadores como mucho cada 5 s.
const ACTIVITY_THROTTLE_MS = 5000

interface JwtPayload {
  sub: string
  ci: string
  roles: Role[]
  sedeId: string | null
  sedePnfId: string | null
  // El API lo marca cuando la clave actual es temporal: hasta cambiarla responde 403 en todo lo demás.
  mustChangePassword?: boolean
  iat: number
  exp: number
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  mustChangePassword: boolean
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
    mustChangePassword: false,
  })

  useEffect(() => {
    const token = localStorage.getItem('sigu_token')
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false, mustChangePassword: false })
      return
    }

    const payload = parseJwt(token)
    if (!payload || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('sigu_token')
      localStorage.removeItem('sigu_user')
      setState({ user: null, isLoading: false, isAuthenticated: false, mustChangePassword: false })
      return
    }

    const mustChangePassword = payload.mustChangePassword === true

    api
      .get('/users/me')
      .then((res) => {
        setState({ user: res.data, isLoading: false, isAuthenticated: true, mustChangePassword })
      })
      .catch((err) => {
        // Sin respuesta del servidor (se cayó la red o el API) no se sabe si el token sigue
        // siendo válido: se conserva la sesión con el usuario guardado para no sacar a la
        // persona por una caída momentánea. Si el servidor responde, el 401 ya limpia todo
        // en el interceptor y aquí solo se cierra la sesión.
        const sinRespuesta = axios.isAxiosError(err) && !err.response
        const guardado = localStorage.getItem('sigu_user')
        if (sinRespuesta && guardado) {
          try {
            setState({ user: JSON.parse(guardado) as User, isLoading: false, isAuthenticated: true, mustChangePassword })
            return
          } catch {
            // El usuario guardado está dañado: se trata como sesión no válida.
          }
        }
        if (!sinRespuesta) localStorage.removeItem('sigu_token')
        setState({ user: null, isLoading: false, isAuthenticated: false, mustChangePassword: false })
      })
  }, [])

  const login = useCallback(async (ci: string, password: string): Promise<string | null> => {
    try {
      // El prefijo de nacionalidad (V-/E-) lo elige el usuario en el formulario de
      // login; aquí solo se normaliza el formato.
      const normalizedCi = ci.trim().toUpperCase()
      const res = await api.post('/auth/login', { ci: normalizedCi, password, clientType: 'WEB' })
      const { accessToken } = res.data

      localStorage.setItem('sigu_token', accessToken)

      const userRes = await api.get('/users/me')
      localStorage.setItem('sigu_user', JSON.stringify(userRes.data))

      setState({
        user: userRes.data,
        isLoading: false,
        isAuthenticated: true,
        mustChangePassword: parseJwt(accessToken)?.mustChangePassword === true,
      })
      return null
    } catch (err) {
      return getErrorMessage(err)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sigu_token')
    localStorage.removeItem('sigu_user')
    setState({ user: null, isLoading: false, isAuthenticated: false, mustChangePassword: false })
  }, [])

  const warningTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!state.isAuthenticated) return

    let ultimoReinicio = 0
    const resetTimers = () => {
      ultimoReinicio = Date.now()
      clearTimeout(warningTimer.current)
      clearTimeout(logoutTimer.current)
      warningTimer.current = setTimeout(() => {
        toast.warning('Su sesión se cerrará en 5 minutos por inactividad.', {
          duration: 60_000,
          action: { label: 'Seguir conectado', onClick: resetTimers },
        })
      }, IDLE_WARNING_MS)
      logoutTimer.current = setTimeout(() => {
        logout()
        toast.info('Sesión cerrada por inactividad.')
      }, IDLE_TIMEOUT_MS)
    }

    const alActividad = () => {
      if (Date.now() - ultimoReinicio >= ACTIVITY_THROTTLE_MS) resetTimers()
    }

    resetTimers()
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, alActividad))

    return () => {
      clearTimeout(warningTimer.current)
      clearTimeout(logoutTimer.current)
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, alActividad))
    }
  }, [state.isAuthenticated, logout])

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
