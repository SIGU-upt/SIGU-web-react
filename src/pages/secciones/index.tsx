import { useState, useEffect, useCallback, Fragment } from "react"
import { useNavigate } from "react-router-dom"
import { Layers, Search, Plus, MoreVertical, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/ui/page-header"
import { SeccionFormModal } from "@/components/forms/seccion-form-modal"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type Seccion, type SedePnf, type Trayecto, type Turno } from "@/types"
import api from "@/config/api"

const TURNO_LABELS: Record<Turno, string> = {
  MANANA: "Mañana",
  TARDE: "Tarde",
  NOCHE: "Noche",
  FIN_DE_SEMANA: "Fin de semana",
}

export function SeccionesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<Seccion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Seccion | null>(null)
  const [deleting, setDeleting] = useState<Seccion | null>(null)

  const [sedePnfOptions, setSedePnfOptions] = useState<SedePnf[]>([])
  const [trayectoOptions, setTrayectoOptions] = useState<Trayecto[]>([])
  const [sedeFilter, setSedeFilter] = useState("")
  const [pnfFilter, setPnfFilter] = useState("") // guarda un sedePnfId
  const [trayectoFilter, setTrayectoFilter] = useState("")

  const isSuperadmin = user?.role === Role.SUPERADMIN
  const isRector = user?.role === Role.RECTOR
  const canSeeSedeFilter = isSuperadmin
  const canEdit = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false
  const canDelete = user?.role === Role.SUPERADMIN

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    api.get('/sede-pnf', { params: { limit: 200 } }).then((res) => {
      const list = res.data.data ?? res.data
      setSedePnfOptions(Array.isArray(list) ? list : [])
    }).catch(() => setSedePnfOptions([]))
    api.get('/trayectos', { params: { limit: 200 } }).then((res) => {
      const list = res.data.data ?? res.data
      setTrayectoOptions(Array.isArray(list) ? list : [])
    }).catch(() => setTrayectoOptions([]))
  }, [])

  // Opciones de sede (solo superadmin): sedes únicas derivadas de las sede-PNF.
  const sedeOptions = Array.from(
    new Map(sedePnfOptions.map((sp) => [sp.sedeId, sp.sede?.nombre ?? sp.sedeId])).entries(),
  ).map(([id, label]) => ({ id, label }))
  const pnfOptionsForSede = sedePnfOptions.filter((sp) => !sedeFilter || sp.sedeId === sedeFilter)
  const selectedPnfId = sedePnfOptions.find((sp) => sp.id === pnfFilter)?.pnfId
  const visibleTrayectoOptions = selectedPnfId
    ? trayectoOptions.filter((t) => t.pnfId === selectedPnfId)
    : trayectoOptions
  // El trayecto se filtra por número, no por fila: un "Trayecto 1" de
  // Informática y uno de Administración son filas distintas en la base de
  // datos, pero para elegir en este select son el mismo concepto — se
  // deduplica por número y el filtro de abajo compara contra ese número, no
  // contra un trayectoId puntual.
  const trayectoNumeroOptions = Array.from(
    new Map(visibleTrayectoOptions.map((t) => [t.numero, t.nombre])).entries(),
  ).sort(([a], [b]) => a - b)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Sin paginación tradicional a propósito: la lista se agrupa por Sede →
      // PNF para resolver la ambigüedad de códigos repetidos entre sedes (ej.
      // "IN21" existe en dos sedes distintas) — partir esa jerarquía a la
      // mitad entre dos páginas sería peor que no paginar, y el volumen real
      // de secciones de una institución cabe cómodo en una sola pantalla.
      const params: Record<string, string | number> = { limit: 200 }
      if (debouncedSearch) params.q = debouncedSearch
      if (canSeeSedeFilter && sedeFilter) params.sedeId = sedeFilter
      if (pnfFilter) params.sedePnfId = pnfFilter
      else if (user?.sedePnfId) params.sedePnfId = user.sedePnfId
      const res = await api.get('/secciones', { params })
      const list = res.data.data ?? res.data
      setData(Array.isArray(list) ? list : [])
      setTotal(res.data.meta?.total ?? (Array.isArray(list) ? list.length : 0))
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [debouncedSearch, canSeeSedeFilter, sedeFilter, pnfFilter, user?.sedePnfId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSedeFilterChange = (value: string) => {
    setSedeFilter(value)
    setPnfFilter("")
    setTrayectoFilter("")
  }
  const handlePnfFilterChange = (value: string) => {
    setPnfFilter(value)
    setTrayectoFilter("")
  }

  const handleCreate = async (form: Record<string, any>) => {
    await api.post('/secciones', form)
    await fetchData()
  }

  const handleEdit = async (form: Record<string, any>) => {
    if (!editing) return
    await api.patch(`/secciones/${editing.id}`, form)
    await fetchData()
  }

  const handleDelete = async () => {
    if (!deleting) return
    await api.delete(`/secciones/${deleting.id}`)
    await fetchData()
  }

  // El filtro de trayecto es client-side (compara número, no id) porque ya
  // se trajo todo con limit:200 arriba — no amerita un viaje al servidor.
  const filteredData = trayectoFilter
    ? data.filter((s) => String(s.trayecto?.numero) === trayectoFilter)
    : data
  const displayTotal = trayectoFilter ? filteredData.length : total

  // Jerarquía Sede → PNF, en el mismo orden en que ya llegan (el backend
  // ordena por código, así que dentro de cada grupo el orden se conserva).
  const sedesUnicas = new Set(filteredData.map((s) => s.sedePnf?.sede?.id).filter(Boolean))
  const pnfsUnicos = new Set(filteredData.map((s) => s.sedePnf?.pnf?.id).filter(Boolean))
  type Grupo = { sedeId: string; sedeNombre: string; pnfId: string; pnfNombre: string; secciones: Seccion[] }
  const grupos: Grupo[] = []
  for (const s of filteredData) {
    const sedeId = s.sedePnf?.sede?.id ?? "—"
    const sedeNombre = s.sedePnf?.sede?.nombre ?? "Sede sin datos"
    const pnfId = s.sedePnf?.pnf?.id ?? "—"
    const pnfNombre = s.sedePnf?.pnf?.nombre ?? "PNF sin datos"
    let grupo = grupos.find((g) => g.sedeId === sedeId && g.pnfId === pnfId)
    if (!grupo) {
      grupo = { sedeId, sedeNombre, pnfId, pnfNombre, secciones: [] }
      grupos.push(grupo)
    }
    grupo.secciones.push(s)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Secciones" subtitle="Gestión de secciones administrativas" icon={<Layers className="h-5 w-5" />} />

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Badge variant="outline" className="gap-1.5 py-1.5"><Layers className="h-3.5 w-3.5" />{displayTotal} {displayTotal === 1 ? 'sección' : 'secciones'}</Badge>
        <Badge variant="outline" className="gap-1.5 py-1.5"><Building2 className="h-3.5 w-3.5" />{sedesUnicas.size} sede{sedesUnicas.size === 1 ? '' : 's'}</Badge>
        <Badge variant="outline" className="py-1.5">{pnfsUnicos.size} programa{pnfsUnicos.size === 1 ? '' : 's'}</Badge>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            {canEdit && (
              <Button className="bg-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
                <Plus className="mr-2 h-4 w-4" /> Nueva Sección
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
            {canSeeSedeFilter && (
              <Select value={sedeFilter || "__todas"} onValueChange={(v) => handleSedeFilterChange(v === "__todas" ? "" : v)}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todas las sedes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todas">Todas las sedes</SelectItem>
                  {sedeOptions.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {(isSuperadmin || isRector) && (
              <Select value={pnfFilter || "__todos"} onValueChange={(v) => handlePnfFilterChange(v === "__todos" ? "" : v)}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todos los PNF" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todos">Todos los PNF</SelectItem>
                  {/* Sin sede ya elegida, dos PNF iguales de sedes distintas son
                      indistinguibles — se agrega la sede hasta que se elija una. */}
                  {pnfOptionsForSede.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sedeFilter ? sp.pnf?.nombre : `${sp.pnf?.nombre} — ${sp.sede?.nombre ?? ''}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={trayectoFilter || "__todos"} onValueChange={(v) => setTrayectoFilter(v === "__todos" ? "" : v)}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todos los trayectos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__todos">Todos los trayectos</SelectItem>
                {trayectoNumeroOptions.map(([numero, nombre]) => (
                  <SelectItem key={numero} value={String(numero)}>{nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Cargando...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No se encontraron secciones.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Código</TableHead>
                  <TableHead className="font-semibold">Trayecto</TableHead>
                  <TableHead className="font-semibold">Turno</TableHead>
                  <TableHead className="font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupos.map((grupo) => (
                  <Fragment key={`${grupo.sedeId}-${grupo.pnfId}`}>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={4} className="py-2 text-xs font-semibold uppercase tracking-wide text-primary">
                        {grupo.sedeNombre} · {grupo.pnfNombre}
                        <span className="ml-2 font-normal normal-case text-muted-foreground">
                          ({grupo.secciones.length} {grupo.secciones.length === 1 ? 'sección' : 'secciones'})
                        </span>
                      </TableCell>
                    </TableRow>
                    {grupo.secciones.map((s) => (
                      <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/secciones/${s.id}`)}>
                        <TableCell><Badge variant="secondary" className="font-mono">{s.codigo}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.trayecto?.nombre ?? s.trayectoId}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.turno ? TURNO_LABELS[s.turno] : "—"}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {canEdit ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Acciones de la sección ${s.codigo}`}><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/secciones/${s.id}`)}>Ver Clases</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setEditing(s); setModalOpen(true) }}>Editar</DropdownMenuItem>
                                {canDelete && (
                                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(s)}>Eliminar</DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs text-muted-foreground">Solo lectura</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SeccionFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={editing ? handleEdit : handleCreate}
        initialData={editing ? { codigo: editing.codigo, sedePnfId: editing.sedePnfId, trayectoId: editing.trayectoId, turno: editing.turno ?? "" } : undefined}
        isEditing={!!editing}
      />

      <ConfirmDeleteModal
        open={!!deleting}
        onOpenChange={(v) => { if (!v) setDeleting(null) }}
        onConfirm={handleDelete}
        title="Eliminar Sección"
        description={`¿Eliminar la sección "${deleting?.codigo}"?`}
      />
    </div>
  )
}
