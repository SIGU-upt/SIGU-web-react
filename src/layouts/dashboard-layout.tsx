import type { ReactNode } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"

interface DashboardLayoutProps {
  children: ReactNode
  onLogout: () => void
}

export function DashboardLayout({
  children,
  onLogout
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset>
        <TopBar onLogout={onLogout} />
        <main>
          <div className="p-4 md:p-6 space-y-6">
            {children}
          </div>
          <p className="px-4 pb-6 text-center text-xs text-muted-foreground md:px-6">
            SIGU — Sistema de Gestión Universitaria · UPT José Félix Ribas, Núcleo Socopó
          </p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
