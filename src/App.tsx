import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { PrivateRoute } from '@/components/auth/PrivateRoute'
import { LandingPage } from '@/pages/landing'
import { LoginPage } from '@/pages/auth/login-page'
import { ForgotPasswordPage } from '@/pages/auth/forgot-password-page'
import { ResetPasswordPage } from '@/pages/auth/reset-password-page'
import { DashboardPage } from '@/pages/dashboard'
import { ProfessorsPage } from '@/pages/professors'
import { StudentsPage } from '@/pages/students'
import { CurriculumUnitsPage } from '@/pages/curriculum-units'
import { SeccionesPage } from '@/pages/secciones'
import { SeccionDetallePage } from '@/pages/secciones/detalle'
import { ReportesPage } from '@/pages/reportes'
import { ConfiguracionPage } from '@/pages/configuracion'
import { PersonalAdministrativoPage } from '@/pages/personal-administrativo'
import { SecurityLogsPage } from '@/pages/security-logs'
import { ClasesSuspendidasPage } from '@/pages/clases-suspendidas'
import { CohortesPage } from '@/pages/cohortes'
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

  const adminRoles = [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR, Role.AUDITOR]

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
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
          path="/secciones/:id"
          element={
            <PrivateRoute allowedRoles={adminRoles}>
              <SeccionDetallePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/personal-administrativo"
          element={
            <PrivateRoute allowedRoles={[Role.SUPERADMIN, Role.RECTOR]}>
              <PersonalAdministrativoPage />
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
                Role.AUDITOR,
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
              allowedRoles={[Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR, Role.AUDITOR]}
            >
              <ConfiguracionPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/security-logs"
          element={
            <PrivateRoute allowedRoles={[Role.SUPERADMIN, Role.RECTOR]}>
              <SecurityLogsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/clases-suspendidas"
          element={
            <PrivateRoute
              allowedRoles={[Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR, Role.AUDITOR]}
            >
              <ClasesSuspendidasPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/cohortes"
          element={
            <PrivateRoute
              allowedRoles={[Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR, Role.AUDITOR]}
            >
              <CohortesPage />
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
