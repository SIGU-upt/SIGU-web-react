import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { PrivateRoute } from '@/components/auth/PrivateRoute'
import { LoginPage } from '@/pages/auth/login-page'
import { DashboardPage } from '@/pages/dashboard'
import { ProfessorsPage } from '@/pages/professors'
import { StudentsPage } from '@/pages/students'
import { CurriculumUnitsPage } from '@/pages/curriculum-units'
import { SeccionesPage } from '@/pages/secciones'
import { ReportesPage } from '@/pages/reportes'
import { ConfiguracionPage } from '@/pages/configuracion'
import { Role } from '@/types'

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground text-lg">Cargando...</div>
      </div>
    )
  }

  const adminRoles = [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR]

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/docentes"
          element={
            <PrivateRoute allowedRoles={adminRoles}>
              <ProfessorsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/estudiantes"
          element={
            <PrivateRoute allowedRoles={adminRoles}>
              <StudentsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/unidades"
          element={
            <PrivateRoute allowedRoles={adminRoles}>
              <CurriculumUnitsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/secciones"
          element={
            <PrivateRoute allowedRoles={adminRoles}>
              <SeccionesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/reportes"
          element={
            <PrivateRoute
              allowedRoles={[
                Role.SUPERADMIN,
                Role.RECTOR,
                Role.COORDINADOR,
                Role.ANALISTA,
                Role.DOCENTE,
              ]}
            >
              <ReportesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/configuracion"
          element={
            <PrivateRoute
              allowedRoles={[Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR]}
            >
              <ConfiguracionPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/security-logs"
          element={
            <PrivateRoute allowedRoles={[Role.SUPERADMIN, Role.RECTOR]}>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Logs de Seguridad</h1>
              </div>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
