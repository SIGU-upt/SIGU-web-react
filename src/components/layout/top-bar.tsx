import { Fragment } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Bell, ChevronDown, HelpCircle, LogOut, User } from "lucide-react"
import { useOnboardingTour } from "@/components/onboarding/use-onboarding-tour"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { routeLabels } from "./navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Role } from "@/types"

const roleLabels: Record<Role, string> = {
  [Role.SUPERADMIN]: "Super Administrador",
  [Role.RECTOR]: "Rector",
  [Role.AUDITOR]: "Auditor",
  [Role.COORDINADOR]: "Coordinador",
  [Role.DOCENTE]: "Docente",
  [Role.ALUMNO]: "Alumno",
  [Role.VIGILANTE]: "Vigilante",
}

// Deriva el rastro de breadcrumb del propio pathname: el primer segmento
// contra el mapa de `navigation` (una sola fuente de verdad), y un segundo
// tramo genérico "Detalle" cuando hay un id de por medio (ej. /secciones/:id)
// — no hay forma de saber el nombre real de la entidad sin otra llamada al
// servidor, que queda fuera de alcance de un breadcrumb.
function useBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return []
  const basePath = `/${segments[0]}`
  const crumbs = [{ label: routeLabels[basePath] ?? segments[0], path: basePath }]
  if (segments.length > 1) {
    crumbs.push({ label: "Detalle", path: pathname })
  }
  return crumbs
}

export function TopBar({ onLogout }: { onLogout?: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const crumbs = useBreadcrumbs(location.pathname)
  const { startTour } = useOnboardingTour()

  const initials = user
    ? (user.nombres?.charAt(0) ?? '') + (user.apellidos?.charAt(0) ?? '')
    : '??'

  const roleName = user ? (roleLabels[user.role] ?? user.role) : ''

  // Sin sistema de notificaciones real todavía — se deja el contador en 0 a
  // propósito (no hardcodeado en el badge) para que quede obvio que es un
  // placeholder, y el badge desaparece en vez de mostrar un "0" permanente
  // que entrena a ignorarlo.
  const unreadCount = 0

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-card shadow-bar">
      <div className="flex h-full items-center gap-4 px-4 md:px-6">
        {/* En escritorio el colapso vive dentro de la propia sidebar (su
            footer); esto solo queda para abrir el sheet móvil, que no tiene
            otra forma de abrirse porque su contenido no está en pantalla. */}
        <SidebarTrigger className="lg:hidden" />

        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {crumbs.map((crumb, i) => (
              <Fragment key={crumb.path}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {i === crumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.path}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            aria-label="Ayuda: repasar el recorrido"
            data-tour="help-button"
            onClick={startTour}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground" aria-label="Notificaciones">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs font-bold">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-muted-foreground">
                No hay notificaciones nuevas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="group flex items-center gap-2 md:gap-3 px-1 md:px-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground group-hover:text-accent-foreground">
                    {user ? `${user.nombres} ${user.apellidos}` : 'Cargando...'}
                  </p>
                  <p className="text-xs text-muted-foreground group-hover:text-accent-foreground">{roleName}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {user?.ci ?? ''}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/perfil")}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive cursor-pointer"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
