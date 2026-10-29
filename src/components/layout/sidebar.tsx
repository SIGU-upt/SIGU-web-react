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
import { useAuth } from "@/contexts/AuthContext"
import { navigation } from "./navigation"

export function Sidebar() {
  const location = useLocation()
  const currentPath = location.pathname
  const { user } = useAuth()
  const { setOpenMobile } = useSidebar()
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
      <SidebarHeader className="h-16 flex-row items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
          <GraduationCap className="h-7 w-7 text-accent" />
        </div>
        <div className="group-data-[collapsible=icon]:hidden">
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
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
                  )}
                  {item.children ? (
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
        <p className="text-[10px] text-sidebar-foreground/70 text-center uppercase tracking-widest group-data-[collapsible=icon]:hidden">
          © 2026 SIGU CORE v1.0
        </p>
      </SidebarFooter>
    </SidebarPrimitive>
  )
}
