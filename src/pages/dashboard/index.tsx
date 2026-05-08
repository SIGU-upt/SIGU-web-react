import { Download, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AttendanceTable } from "@/components/dashboard/attendance-table"
import { AnalyticsSection } from "@/components/dashboard/analytics-section"
import { AddUserModal } from "@/components/dashboard/add-user-modal"
import { PageHeader } from "@/components/ui/page-header"

export function DashboardPage() {
  return (
    <>
      <PageHeader 
        title="Panel de Control"
        subtitle="Bienvenido al Sistema de Gestión Universitaria"
        icon={<LayoutDashboard className="h-6 w-6" />}
        actions={
          <>
            <AddUserModal />
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md">
              <Download className="mr-2 h-4 w-4" />
              Exportar Reporte
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <StatsCards />

      {/* Analytics Section */}
      <AnalyticsSection />

      {/* Attendance Table */}
      <AttendanceTable />
    </>
  )
}
