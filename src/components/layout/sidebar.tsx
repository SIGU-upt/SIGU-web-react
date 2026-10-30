import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { GraduationCap, ChevronDown } from "lucide-react"
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { navigation } from "./navigation"

export function Sidebar() {
  const location = useLocation()
  const currentPath = location.pathname
  const { user } = useAuth()
  const { setOpenMobile, state, isMobile } = useSidebar()
  const colapsado = state === "collapsed" && !isMobile
  // El submenú solo se ve con el grupo abierto y el sidebar expandido; ahí la barra amarilla la lleva el hijo activo.
  const subitemVisible = (children: unknown, abierto: boolean, hijoActivo?: boolean) =>
    !!children && abierto && !colapsado && !!hijoActivo
  const [openMenus, setOpenMenus] = useState<string[]>(["usuarios"])

  // El sheet móvil no se cerraba solo al navegar (quedaba tapando la página
  // nueva) — no había ningún efecto ligado a la ruta que lo cerrara.
  useEffect(() => {
    setOpenMobile(false)
  }, [currentPath, setOpenMobile])

  const filteredNav = navigation
    .filter((item) => {
      if (!item.roles) return true
      return user ? item.roles.includes(user.role) : false
    })
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => !child.roles || (user && child.roles.includes(user.role))),
    }))

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    )
  }

  return (
    <SidebarPrimitive collapsible="icon">
      {/* Contraído, el ícono queda centrado en los 48 px (px-1 + 40 px de ícono); el padding se anima
          junto con el ancho para que el logo no salte ni se recorte. La marca pasa a `absolute` para
          no empujar el ícono mientras se desvanece. */}
      <SidebarHeader className="relative h-16 flex-row items-center gap-3 border-b border-sidebar-border px-4 transition-[padding] duration-200 ease-in-out group-data-[collapsible=icon]:px-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
          <GraduationCap className="h-7 w-7 text-accent" />
        </div>
        <div className="whitespace-nowrap transition-opacity duration-150 delay-100 ease-in-out group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:left-17 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-100">
          <h1 className="text-lg font-bold text-sidebar-foreground leading-none">SIGU</h1>
          <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest mt-1">Gestión</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {filteredNav.map((item) => {
              const isChildActive = item.children?.some((child) => child.path === currentPath)
              const isActive = currentPath === item.path || isChildActive
              const isOpen = openMenus.includes(item.id)

              return (
                <SidebarMenuItem key={item.id}>
                  {/* La barra amarilla va en la fila activa: la del ítem (centrada si es un enlace solo,
                      a la altura del botón si es un grupo) o, con el grupo abierto, la del hijo (más abajo). */}
                  {isActive && !subitemVisible(item.children, isOpen, isChildActive) && (
                    <span className={`absolute left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent ${item.children ? "top-4" : "top-1/2"}`} />
                  )}
                  {item.children && colapsado ? (
                    // Contraído no hay donde desplegar el submenú: se abre como menú al costado.
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton isActive={isActive} tooltip={item.name} data-tour={`nav-${item.id}`}>
                          <item.icon />
                          <span className="flex-1">{item.name}</span>
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start" sideOffset={8} className="min-w-44">
                        {item.children.map((child) => (
                          <DropdownMenuItem key={child.id} asChild className={currentPath === child.path ? "bg-accent/10 font-medium" : undefined}>
                            <Link to={child.path} aria-current={currentPath === child.path ? "page" : undefined}>{child.name}</Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : item.children ? (
                    <>
                      <SidebarMenuButton onClick={() => toggleMenu(item.id)} isActive={isActive} tooltip={item.name} data-tour={`nav-${item.id}`}>
                        <item.icon />
                        <span className="flex-1">{item.name}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                      </SidebarMenuButton>
                      {isOpen && (
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.id}>
                              {currentPath === child.path && (
                                // -left-6.5 = el sangrado del submenú (26 px): la barra queda a la misma x que la de los demás ítems.
                                <span className="absolute -left-6.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
                              )}
                              <SidebarMenuSubButton asChild isActive={currentPath === child.path}>
                                <Link to={child.path}>{child.name}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </>
                  ) : (
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link to={item.path || "#"} data-tour={`nav-${item.id}`}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 border-t border-sidebar-border/30 p-3">
        <SidebarTrigger
          className="self-end text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:self-center [&>svg]:transition-transform [&>svg]:duration-200 group-data-[state=collapsed]:[&>svg]:rotate-180"
        />
        <p className="max-h-4 overflow-hidden whitespace-nowrap text-[10px] text-sidebar-foreground/70 text-center uppercase tracking-widest transition-[opacity,max-height,margin] duration-150 delay-100 ease-in-out group-data-[collapsible=icon]:-mt-3 group-data-[collapsible=icon]:max-h-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-100">
          © 2026 SIGU CORE v1.0
        </p>
      </SidebarFooter>
    </SidebarPrimitive>
  )
}
