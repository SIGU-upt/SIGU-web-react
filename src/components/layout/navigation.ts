import {
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  FileBarChart,
  Settings,
  GraduationCap,
  Shield,
  CalendarOff,
  AlertTriangle,
  Archive,
} from "lucide-react"
import { Role } from "@/types"

export interface NavItem {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  path?: string
  children?: { id: string; name: string; path: string; roles?: Role[] }[]
  roles?: Role[]
}

export const navigation: NavItem[] = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", roles: Object.values(Role) },
  {
    id: "usuarios",
    name: "Usuarios",
    icon: Users,
    roles: [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR, Role.AUDITOR],
    children: [
      { id: "docentes", name: "Docentes", path: "/docentes" },
      { id: "estudiantes", name: "Estudiantes", path: "/estudiantes" },
      { id: "personal-administrativo", name: "Personal Administrativo", path: "/personal-administrativo", roles: [Role.SUPERADMIN, Role.RECTOR] },
    ],
  },
  { id: "unidades", name: "Unidades Curriculares", icon: BookOpen, path: "/unidades", roles: [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR, Role.AUDITOR] },
  { id: "secciones", name: "Secciones", icon: Layers, path: "/secciones", roles: [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR, Role.AUDITOR] },
  { id: "clases-suspendidas", name: "Clases Suspendidas", icon: CalendarOff, path: "/clases-suspendidas", roles: [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR, Role.AUDITOR] },
  { id: "matriculas", name: "Matrículas", icon: GraduationCap, path: "/matriculas", roles: [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR, Role.AUDITOR] },
  { id: "inconsistencias", name: "Inconsistencias", icon: AlertTriangle, path: "/inconsistencias", roles: [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR] },
  { id: "reportes", name: "Reportes", icon: FileBarChart, path: "/reportes", roles: [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR, Role.AUDITOR, Role.DOCENTE] },
  { id: "configuracion", name: "Configuración", icon: Settings, path: "/configuracion", roles: [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR, Role.AUDITOR] },
  { id: "security-logs", name: "Seguridad", icon: Shield, path: "/security-logs", roles: [Role.SUPERADMIN, Role.RECTOR, Role.AUDITOR] },
  { id: "historial", name: "Historial de eliminados", icon: Archive, path: "/historial", roles: [Role.SUPERADMIN] },
]

// Mapa ruta→nombre derivado de `navigation` (fuente única) — lo consume el
// breadcrumb del top-bar en vez de mantener una segunda lista de labels.
export const routeLabels: Record<string, string> = navigation.reduce((acc, item) => {
  if (item.path) acc[item.path] = item.name
  item.children?.forEach((child) => { acc[child.path] = child.name })
  return acc
}, { "/perfil": "Perfil", "/sedes": "Sedes", "/pnfs": "PNFs" } as Record<string, string>)
