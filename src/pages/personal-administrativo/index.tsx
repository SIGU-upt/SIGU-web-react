import { useState, useEffect, useCallback } from "react"
import { Shield, Search, Plus, SmartphoneNfc, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { PageHeader } from "@/components/ui/page-header"
import { AdminUserFormModal } from "@/components/forms/admin-user-form-modal"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type User, type Sede, type SedePnf } from "@/types"
import api from "@/config/api"

const ROLE_LABELS: Record<string, string> = {
  [Role.RECTOR]: 'Rector',
  [Role.COORDINADOR]: 'Coordinador',
  [Role.ANALISTA]: 'Analista',
}

export function PersonalAdministrativoPage() {
  const { user } = useAuth()
  const [data, setData] = useState<User[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [sedePnfs, setSedePnfs] = useState<SedePnf[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [resettingDevice, setResettingDevice] = useState<User | null>(null)
  const [sedeFilter, setSedeFilter] = useState("")
  const [pnfFilter, setPnfFilter] = useState("") // guarda un sedePnfId

  const allowedRoles: Role[] = user?.role === Role.SUPERADMIN
    ? [Role.RECTOR, Role.COORDINADOR, Role.ANALISTA]
    : [Role.COORDINADOR, Role.ANALISTA]

  // Igual que en Estudiantes/Docentes: superadmin tiene alcance global (necesita
  // sede + PNF para acotar); rector ya viene escopado a su sede por el backend
  // (GET /sede-pnf y GET /users ya se lo filtran), solo elige PNF dentro de ella.
  const isSuperadmin = user?.role === Role.SUPERADMIN
  const isRector = user?.role === Role.RECTOR

  const canEdit = user ? [Role.SUPERADMIN, Role.RECTOR].includes(user.role) : false
  const canDelete = user?.role === Role.SUPERADMIN
  const canResetDevice = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Opciones de sede (solo superadmin): la lista de sedes ya se carga para mostrar
  // la columna Sede/PNF, se reutiliza para el filtro.
  const sedeOptions = isSuperadmin
    ? sedes.map((s) => ({ id: s.id, label: s.nombre }))
    : undefined

  // Opciones de PNF: para superadmin se limitan a la sede elegida; para rector, el
  // servidor ya devuelve solo las sede-PNF de su propia sede.
  const pnfOptions =
    isSuperadmin || isRector
      ? sedePnfs
          .filter((sp) => !isSuperadmin || !sedeFilter || sp.sedeId === sedeFilter)
          .map((sp) => ({ id: sp.id, label: sp.pnf?.nombre ?? sp.id }))
      : undefined

  const handleSedeFilterChange = (value: string) => {
    setSedeFilter(value)
    setPnfFilter("")
    setPage(1)
  }
  const handlePnfFilterChange = (value: string) => {
    setPnfFilter(value)
    setPage(1)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // El límite máximo del backend es 200; como se combinan varios roles a la vez
      // (rector/coordinador/analista son listas acotadas), se pagina el resultado
      // combinado en el cliente en vez de fusionar meta.total de cada rol por separado.
      const extraParams: Record<string, string> = {}
      if (debouncedSearch) extraParams.q = debouncedSearch
      if (isSuperadmin && sedeFilter) extraParams.sedeId = sedeFilter
      if (pnfFilter) extraParams.sedePnfId = pnfFilter
      const [usersResults, sedesRes, sedePnfRes] = await Promise.all([
        Promise.all(allowedRoles.map((role) => api.get('/users', {
          params: { role, limit: 200, ...extraParams },
        }))),
        api.get('/sedes'),
        api.get('/sede-pnf'),
      ])
      const combined = usersResults.flatMap((res) => {
        const list = res.data.data ?? res.data
        return Array.isArray(list) ? list : []
      })
      setData(combined)
      const sedesList = sedesRes.data.data ?? sedesRes.data
      setSedes(Array.isArray(sedesList) ? sedesList : [])
      const sedePnfList = sedePnfRes.data.data ?? sedePnfRes.data
      setSedePnfs(Array.isArray(sedePnfList) ? sedePnfList : [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, debouncedSearch, isSuperadmin, sedeFilter, pnfFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async (form: Record<string, any>) => {
    await api.post('/users', form)
    await fetchData()
  }

  const handleEdit = async (form: Record<string, any>) => {
    if (!editing) return
    const payload: Record<string, any> = {}
    if (form.nombres) payload.nombres = form.nombres
    if (form.apellidos) payload.apellidos = form.apellidos
    if (form.email) payload.email = form.email
    if (form.sedeActualId) payload.sedeActualId = form.sedeActualId
    if (form.sedePnfId) payload.sedePnfId = form.sedePnfId
    await api.patch(`/users/${editing.id}`, payload)
    await fetchData()
  }

  const handleDelete = async () => {
    if (!deleting) return
    await api.delete(`/users/${deleting.id}`)
    await fetchData()
  }

  const handleResetDevice = async () => {
    if (!resettingDevice) return
    await api.patch(`/users/${resettingDevice.id}/reset-device`)
    toast.success(`Dispositivo de ${resettingDevice.nombreCompleto} reiniciado correctamente.`)
  }

  const sedeNombre = (id: string | null) => sedes.find((s) => s.id === id)?.nombre ?? '—'
  const sedePnfLabel = (id: string | null) => {
    const sp = sedePnfs.find((s) => s.id === id)
    return sp ? `${sp.pnf?.nombre ?? ''} — ${sp.sede?.nombre ?? ''}` : '—'
  }

  const perPage = 10
  const totalPages = Math.ceil(data.length / perPage)
  const start = (page - 1) * perPage
  const paginated = data.slice(start, start + perPage)

  return (
    <div className="space-y-6">
      <PageHeader title="Personal Administrativo" subtitle="Gestión de rectores, coordinadores y analistas" icon={<Shield className="h-5 w-5" />} />
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por nombre, cédula o email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              {sedeOptions && (
                <Select value={sedeFilter || "__all__"} onValueChange={(v) => handleSedeFilterChange(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Sede" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las sedes</SelectItem>
                    {sedeOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {pnfOptions && (
                <Select value={pnfFilter || "__all__"} onValueChange={(v) => handlePnfFilterChange(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="PNF" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos los PNF</SelectItem>
                    {pnfOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {canEdit && (
              <Button className="bg-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
                <Plus className="mr-2 h-4 w-4" /> Nuevo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Cargando...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Cédula</TableHead>
                    <TableHead className="font-semibold">Rol</TableHead>
                    <TableHead className="font-semibold">Sede/PNF</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.nombreCompleto}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.ci}</TableCell>
                      <TableCell><Badge variant="secondary">{ROLE_LABELS[u.role] ?? u.role}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.role === Role.RECTOR ? sedeNombre(u.sedeActualId) : u.role === Role.COORDINADOR ? sedePnfLabel(u.sedePnfId) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {canEdit || canResetDevice ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEdit && (
                                <DropdownMenuItem onClick={() => { setEditing(u); setModalOpen(true) }}>Editar</DropdownMenuItem>
                              )}
                              {canResetDevice && (
                                <DropdownMenuItem onClick={() => setResettingDevice(u)}>
                                  <SmartphoneNfc className="mr-2 h-4 w-4" />
                                  Reiniciar Dispositivo
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(u)}>Eliminar</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-xs text-muted-foreground">Solo lectura</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls currentPage={page} totalPages={totalPages} totalItems={data.length} startIndex={start} endIndex={start + perPage} onPageChange={setPage} label="registros" />
            </>
          )}
        </CardContent>
      </Card>

      <AdminUserFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={editing ? handleEdit : handleCreate}
        allowedRoles={allowedRoles}
        initialData={editing ? {
          nombres: editing.nombres,
          apellidos: editing.apellidos,
          ci: editing.ci,
          email: editing.email,
          role: editing.role,
          sedeActualId: editing.sedeActualId ?? undefined,
          sedePnfId: editing.sedePnfId ?? undefined,
        } : undefined}
        isEditing={!!editing}
      />

      <ConfirmDeleteModal
        open={!!deleting}
        onOpenChange={(v) => { if (!v) setDeleting(null) }}
        onConfirm={handleDelete}
        title="Eliminar Usuario"
        description={`¿Eliminar a "${deleting?.nombreCompleto}"?`}
      />

      <ConfirmDeleteModal
        open={!!resettingDevice}
        onOpenChange={(v) => { if (!v) setResettingDevice(null) }}
        onConfirm={handleResetDevice}
        title="Reiniciar dispositivo"
        description={`Esto permitirá que ${resettingDevice?.nombreCompleto} vuelva a iniciar sesión desde un nuevo dispositivo. ¿Desea continuar?`}
        confirmLabel="Reiniciar"
        loadingLabel="Reiniciando..."
      />
    </div>
  )
}
