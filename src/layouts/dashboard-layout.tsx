import { ReactNode } from "react"
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
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar className="hidden lg:block" />

      {/* Top Bar */}
      <TopBar onLogout={onLogout} />

      {/* Main Content */}
      <main className="lg:ml-64 pt-16">
        <div className="p-4 md:p-6 space-y-6">
          {children}
        </div>
      </main>
    </div>
  )
}
