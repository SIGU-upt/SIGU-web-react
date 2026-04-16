import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TopBar } from "@/components/dashboard/top-bar"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AttendanceTable } from "@/components/dashboard/attendance-table"
import { AnalyticsSection } from "@/components/dashboard/analytics-section"
import { AddUserModal } from "@/components/dashboard/add-user-modal"
import { Toaster } from "@/components/ui/toaster"
import { LoginView } from "@/components/auth/login-view"
import { ProfessorsTable } from "@/components/dashboard/professors-table"

function App() {
  const [currentView, setCurrentView] = useState("dashboard")
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("sigu_auth") === "true"
  })

  const handleLogin = () => {
    localStorage.setItem("sigu_auth", "true")
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("sigu_auth")
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginView onLogin={handleLogin} />
        <Toaster />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar 
        className="hidden lg:block" 
        onNavigate={setCurrentView} 
        currentView={currentView}
      />

      {/* Top Bar */}
      <TopBar onLogout={handleLogout} />

      {/* Main Content */}
      <main className="lg:ml-64 pt-16">
        <div className="p-4 md:p-6 space-y-6">
          {currentView === "dashboard" ? (
            <>
              {/* Page Header */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Panel de Control
                  </h1>
                  <p className="text-muted-foreground">
                    Bienvenido al Sistema de Gestión Universitaria
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <AddUserModal />
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Reporte
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <StatsCards />

              {/* Analytics Section */}
              <AnalyticsSection />

              {/* Attendance Table */}
              <AttendanceTable />
            </>
          ) : currentView === "docentes" ? (
            <ProfessorsTable />
          ) : (
            <div className="flex items-center justify-center h-[60vh]">
              <p className="text-muted-foreground italic">Vista "{currentView}" en desarrollo...</p>
            </div>
          )}
        </div>
      </main>
      <Toaster />
    </div>
  )
}

export default App
