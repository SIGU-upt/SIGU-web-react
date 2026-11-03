import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, GraduationCap, Layers, User as UserIcon } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import api from "@/config/api"
import { useAuth } from "@/contexts/AuthContext"
import { type Pnf, type Sede, type Seccion, type User } from "@/types"
import { ROLES_CON_BUSCADOR } from "./roles"

// Buscador global (Cmd/Ctrl+K): busca en paralelo sobre los mismos endpoints
// que ya aceptan `q=` (PNFs, Sedes, Secciones, Usuarios) — sin endpoint nuevo.

interface Resultado {
  id: string
  grupo: string
  titulo: string
  subtitulo?: string
  path: string
  icono: typeof Building2
}

async function buscarEnLista<T>(url: string, params: Record<string, string>): Promise<T[]> {
  try {
    const res = await api.get(url, { params })
    const data: unknown = res.data?.data ?? res.data
    return Array.isArray(data) ? (data as T[]) : []
  } catch {
    // Un 403 (rol sin acceso a ese recurso) o cualquier falla puntual no debe
    // tumbar el resto de los resultados — simplemente ese grupo queda vacío.
    return []
  }
}

export function GlobalSearch() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [buscando, setBuscando] = useState(false)

  const habilitado = !!user && ROLES_CON_BUSCADOR.includes(user.role)

  useEffect(() => {
    if (!habilitado) return
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    // El botón visible del top-bar (sin acceso directo al estado de este
    // componente, que vive montado una sola vez en DashboardLayout) dispara
    // este mismo evento para abrir el buscador sin duplicar su lógica.
    const onAbrirEvento = () => setOpen(true)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("sigu:abrir-buscador", onAbrirEvento)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("sigu:abrir-buscador", onAbrirEvento)
    }
  }, [habilitado])

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  useEffect(() => {
    const q = query.trim()
    if (!open || q.length < 2) {
      setResultados([])
      return
    }
    const timeout = setTimeout(async () => {
      setBuscando(true)
      const params = { q, limit: "5" }
      const [pnfs, sedes, secciones, alumnos, docentes] = await Promise.all([
        buscarEnLista<Pnf>('/pnfs', params),
        buscarEnLista<Sede>('/sedes', params),
        buscarEnLista<Seccion & { codigo: string }>('/secciones', params),
        buscarEnLista<User>('/users', { ...params, role: 'ALUMNO' }),
        buscarEnLista<User>('/users', { ...params, role: 'DOCENTE' }),
      ])
      setResultados([
        ...pnfs.map((p) => ({ id: p.id, grupo: 'PNF', titulo: `${p.codigo} — ${p.nombre}`, path: `/pnfs/${p.id}`, icono: GraduationCap })),
        ...sedes.map((s) => ({ id: s.id, grupo: 'Sedes', titulo: s.nombre, path: `/sedes/${s.id}`, icono: Building2 })),
        ...secciones.map((s) => ({ id: s.id, grupo: 'Secciones', titulo: `Sección ${s.codigo}`, path: `/secciones/${s.id}`, icono: Layers })),
        ...alumnos.map((a) => ({ id: a.id, grupo: 'Estudiantes', titulo: a.nombreCompleto, subtitulo: a.ci, path: '/estudiantes', icono: UserIcon })),
        ...docentes.map((d) => ({ id: d.id, grupo: 'Docentes', titulo: d.nombreCompleto, subtitulo: d.ci, path: '/docentes', icono: UserIcon })),
      ])
      setBuscando(false)
    }, 250)
    return () => clearTimeout(timeout)
  }, [open, query])

  if (!habilitado) return null

  const grupos = ['PNF', 'Sedes', 'Secciones', 'Estudiantes', 'Docentes'] as const

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Buscador global"
      description="Buscar un PNF, sede, sección, estudiante o docente"
    >
      <CommandInput
        placeholder="Buscar PNF, sede, sección, estudiante o docente..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.trim().length < 2 ? (
          <CommandEmpty>Escriba al menos 2 letras para buscar.</CommandEmpty>
        ) : buscando ? (
          <CommandEmpty>Buscando...</CommandEmpty>
        ) : resultados.length === 0 ? (
          <CommandEmpty>Sin resultados.</CommandEmpty>
        ) : (
          grupos.map((grupo) => {
            const items = resultados.filter((r) => r.grupo === grupo)
            if (items.length === 0) return null
            return (
              <CommandGroup key={grupo} heading={grupo}>
                {items.map((r) => {
                  const Icono = r.icono
                  return (
                    <CommandItem
                      key={`${r.grupo}-${r.id}`}
                      value={`${r.grupo}-${r.id}-${r.titulo}`}
                      onSelect={() => {
                        setOpen(false)
                        navigate(r.path)
                      }}
                    >
                      <Icono className="h-4 w-4" />
                      <span>{r.titulo}</span>
                      {r.subtitulo && <span className="ml-auto text-xs text-muted-foreground">{r.subtitulo}</span>}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )
          })
        )}
      </CommandList>
    </CommandDialog>
  )
}
