import { useState, useEffect } from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import { DashboardLayout } from "@/layouts/dashboard-layout"
import routesPages from "@/config/routes"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("sigu_auth") === "true"
  })
  
  const location = useLocation()

  const handleLogin = () => {
    localStorage.setItem("sigu_auth", "true")
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("sigu_auth")
    setIsAuthenticated(false)
  }

  // Redirección si no está autenticado
  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  // Redirección si ya está autenticado e intenta ir al login
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <>
      <Routes>
        {routesPages.map((route) => {
          const Component = route.component

          if (route.isPublic) {
            return (
              <Route 
                key={route.path} 
                path={route.path} 
                element={<Component onLogin={handleLogin} />} 
              />
            )
          }

          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <DashboardLayout 
                  onLogout={handleLogout}
                >
                  <Component />
                </DashboardLayout>
              }
            />
          )
        })}
        {/* Fallback para rutas no encontradas */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
