import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  FileBarChart,
  Settings,
  GraduationCap,
  ChevronDown,
} from "lucide-react"

const navigation = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
  { id: "usuarios", name: "Usuarios", icon: Users, children: [
    { id: "docentes", name: "Docentes" },
    { id: "estudiantes", name: "Estudiantes" },
  ]},
  { id: "unidades", name: "Unidades Curriculares", icon: BookOpen },
  { id: "secciones", name: "Secciones", icon: Layers },
  { id: "reportes", name: "Reportes", icon: FileBarChart },
  { id: "configuracion", name: "Configuración", icon: Settings },
]

interface SidebarProps {
  className?: string
  onNavigate: (view: string) => void
  currentView: string
}

export function DashboardSidebar({ className, onNavigate, currentView }: SidebarProps) {
  const [openMenus, setOpenMenus] = useState<string[]>(["usuarios"])

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  return (
    <aside className={cn("fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar", className)}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <GraduationCap className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground leading-none">SIGU</h1>
            <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest mt-1">Gestión</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isChildActive = item.children?.some(child => child.id === currentView)
            const isActive = currentView === item.id || isChildActive
            const isOpen = openMenus.includes(item.id)
            
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.children) {
                      toggleMenu(item.id)
                    } else {
                      onNavigate(item.id)
                    }
                  }}
                  className={cn(
                    "w-full group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-accent" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground"
                  )} />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.children && (
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isOpen ? "rotate-180" : ""
                    )} />
                  )}
                </button>
                {item.children && isOpen && (
                  <div className="ml-8 mt-1 space-y-1 border-l border-sidebar-border/30 pl-2">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => onNavigate(child.id)}
                        className={cn(
                          "w-full text-left block rounded-md px-3 py-2 text-sm transition-colors cursor-pointer",
                          currentView === child.id
                            ? "text-accent font-semibold"
                            : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                        )}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border/30 p-4">
          <p className="text-[10px] text-sidebar-foreground/40 text-center uppercase tracking-widest">
            © 2026 SIGU CORE v1.0
          </p>
        </div>
      </div>
    </aside>
  )
}
