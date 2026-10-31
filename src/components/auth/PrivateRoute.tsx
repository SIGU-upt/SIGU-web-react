import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Role } from '@/types'
import { DashboardLayout } from '@/layouts/dashboard-layout'

interface PrivateRouteProps {
  children: React.ReactNode
  allowedRoles?: Role[]
}

export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { isAuthenticated, isLoading, user, logout, mustChangePassword } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Con una clave temporal el API rechaza todo lo demás: se lleva a la persona a Perfil, donde la cambia.
  if (mustChangePassword && location.pathname !== '/perfil') {
    return <Navigate to="/perfil" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <DashboardLayout onLogout={logout}>
        <div className="flex flex-col items-center justify-center py-20">
          <h1 className="text-2xl font-bold text-destructive">Acceso denegado</h1>
          <p className="mt-2 text-muted-foreground">
            No tiene permisos para acceder a esta sección
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return <DashboardLayout onLogout={logout}>{children}</DashboardLayout>
}
