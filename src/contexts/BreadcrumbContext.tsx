import { createContext, useCallback, useContext, useState, type ReactNode } from "react"

// Guarda el nombre real de la entidad que cada pantalla de detalle ya cargó
// (sección, PNF, sede...), indexado por pathname, para que el breadcrumb del
// top-bar pueda mostrarlo en vez del genérico "Detalle" — sin pedirle una
// segunda petición solo para el nombre. Vive en el root de la app (no dentro
// de DashboardLayout) para no perderse entre una navegación y otra.
interface BreadcrumbContextValue {
  labels: Record<string, string>
  setLabel: (path: string, label: string) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({})

  const setLabel = useCallback((path: string, label: string) => {
    setLabels((prev) => (prev[path] === label ? prev : { ...prev, [path]: label }))
  }, [])

  return <BreadcrumbContext.Provider value={{ labels, setLabel }}>{children}</BreadcrumbContext.Provider>
}

export function useBreadcrumbContext() {
  const ctx = useContext(BreadcrumbContext)
  if (!ctx) throw new Error("useBreadcrumbContext debe usarse dentro de BreadcrumbProvider")
  return ctx
}
