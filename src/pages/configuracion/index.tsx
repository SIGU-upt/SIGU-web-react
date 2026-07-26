import { useState, useEffect, useCallback, Fragment } from "react"
import { Settings, Search, Plus, Trash2, Building, BookOpen, LayoutList, Clock, MoreVertical, Wand2, Calendar } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/ui/page-header"
import { EntityFormModal, type EntityField } from "@/components/forms/entity-form-modal"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import { useAuth } from "@/contexts/AuthContext"
import { Role } from "@/types"
import api from "@/config/api"

const entityConfigs: Record<string, { title: string; icon: React.ReactNode; endpoint: string; fields: EntityField[]; columns: string[]; renderRow: (item: any) => React.ReactNode[]; editRoles?: Role[]; searchable?: boolean; hasGenerarEstructura?: boolean; hasGenerarMultiple?: boolean; groupLabel?: (item: any) => string }> = {
  sedes: {
    title: 'Sedes', icon: <Building className="h-5 w-5" />, endpoint: '/sedes',
    editRoles: [Role.SUPERADMIN, Role.RECTOR],
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'ubicacion', label: 'Ubicación', required: true },
    ],
    columns: ['Nombre', 'Ubicación'],
    renderRow: (s) => [s.nombre, <span className="text-sm text-muted-foreground">{s.ubicacion}</span>],
  },
  pnfs: {
    title: 'PNFs', icon: <BookOpen className="h-5 w-5" />, endpoint: '/pnfs',
    editRoles: [Role.SUPERADMIN, Role.RECTOR],
    hasGenerarEstructura: true,
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'codigo', label: 'Código', required: true },
      { name: 'requierePiu', label: 'Requiere PIU (Trayecto 0)', type: 'checkbox' as const, createOnly: true, defaultValue: true },
      { name: 'numeroTrayectos', label: 'Cantidad de trayectos a generar (1-6)', type: 'number' as const, required: false, createOnly: true, defaultValue: 4 },
    ],
    columns: ['Nombre', 'Código'],
    renderRow: (p) => [p.nombre, <Badge variant="secondary" className="font-mono">{p.codigo}</Badge>],
  },
  trayectos: {
    title: 'Trayectos', icon: <LayoutList className="h-5 w-5" />, endpoint: '/trayectos',
    groupLabel: (t) => t.pnf?.nombre ?? 'Sin PNF',
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'numero', label: 'Número (0=PIU, 1-4)', required: true, type: 'number' as const },
      { name: 'pnfId', label: 'PNF', required: true, type: 'select' as const, optionsEndpoint: '/pnfs', optionLabel: (p: any) => p.nombre, optionValue: (p: any) => p.id },
    ],
    columns: ['Nombre', 'Número'],
    renderRow: (t) => [t.pnf?.nombre ? `${t.pnf.nombre} — ${t.nombre}` : t.nombre, <Badge variant="secondary">{t.numero}</Badge>],
  },
  tramos: {
    title: 'Tramos', icon: <Clock className="h-5 w-5" />, endpoint: '/tramos',
    // El backend (TramosService.findAll) no admite un filtro de texto 'q';
    // enviarlo produce un 400 "Filtro 'q' no permitido". Se filtra en el cliente.
    searchable: false,
    fields: [
      { name: 'numero', label: 'Número (1-3)', required: true, type: 'number' as const },
      { name: 'trayectoId', label: 'Trayecto', required: true, type: 'select' as const, optionsEndpoint: '/trayectos', optionLabel: (t: any) => t.pnf?.nombre ? `${t.pnf.nombre} — ${t.nombre}` : t.nombre, optionValue: (t: any) => t.id },
      { name: 'isPer', label: 'Es PER', type: 'checkbox' as const },
      { name: 'fechaInicio', label: 'Fecha inicio (opcional)', type: 'date' as const, required: false },
      { name: 'fechaFin', label: 'Fecha fin (opcional)', type: 'date' as const, required: false },
    ],
    // La mayoría de los tramos se generan solos (A-4); esta pantalla existe
    // sobre todo para el tramo PER, que es excepcional y necesita fechas
    // propias. Se resume a 2 columnas y se agrega a qué trayecto/PNF
    // pertenece (antes no lo mostraba, y "Trayecto 1" se repite entre PNF).
    columns: ['Trayecto', 'Tramo', 'Vigencia'],
    renderRow: (t) => [
      t._trayectoLabel ?? t.trayecto?.nombre ?? t.trayectoId,
      <Badge variant={t.isPer ? 'default' : 'secondary'}>{t.isPer ? 'PER' : `Tramo ${t.numero}`}</Badge>,
      <span className="text-sm text-muted-foreground">{t.fechaInicio && t.fechaFin ? `${t.fechaInicio} — ${t.fechaFin}` : '—'}</span>,
    ],
  },
  periodos: {
    title: 'Períodos', icon: <Calendar className="h-5 w-5" />, endpoint: '/periodos',
    editRoles: [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR],
    hasGenerarMultiple: true,
    // El backend (PeriodosService.findAll) no admite un filtro de texto 'q'.
    searchable: false,
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'fechaInicio', label: 'Fecha inicio', type: 'date' as const, required: true },
      { name: 'fechaFin', label: 'Fecha fin', type: 'date' as const, required: true },
      { name: 'sedePnfId', label: 'Sede-PNF', required: true, type: 'select' as const, optionsEndpoint: '/sede-pnf', optionLabel: (sp: any) => `${sp.pnf?.nombre ?? sp.pnfId} — ${sp.sede?.nombre ?? sp.sedeId}`, optionValue: (sp: any) => sp.id },
      { name: 'activo', label: 'Activo', type: 'checkbox' as const, defaultValue: true },
    ],
    columns: ['Nombre', 'Vigencia', 'Sede-PNF', 'Activo'],
    renderRow: (p) => [
      p.nombre,
      <span className="text-sm text-muted-foreground">{p.fechaInicio} — {p.fechaFin}</span>,
      <span className="text-sm text-muted-foreground">{p.sedePnf ? `${p.sedePnf.pnf?.nombre ?? ''} — ${p.sedePnf.sede?.nombre ?? ''}` : '—'}</span>,
      <Badge variant={p.activo ? 'default' : 'secondary'}>{p.activo ? 'Sí' : 'No'}</Badge>,
    ],
  },
  sedePnf: {
    title: 'Sede-PNF', icon: <Building className="h-5 w-5" />, endpoint: '/sede-pnf',
    editRoles: [Role.SUPERADMIN, Role.RECTOR],
    // El backend (SedePnfService.findAll) no admite un filtro de texto 'q';
    // enviarlo produce un 400 "Filtro 'q' no permitido". Se filtra en el cliente.
    searchable: false,
    fields: [
      { name: 'sedeId', label: 'Sede', required: true, type: 'select' as const, optionsEndpoint: '/sedes', optionLabel: (s: any) => s.nombre, optionValue: (s: any) => s.id },
      { name: 'pnfId', label: 'PNF', required: true, type: 'select' as const, optionsEndpoint: '/pnfs', optionLabel: (p: any) => p.nombre, optionValue: (p: any) => p.id },
    ],
    columns: ['Sede', 'PNF'],
    renderRow: (sp) => [sp.sede?.nombre ?? '—', <Badge variant="secondary" className="font-mono">{sp.pnf?.codigo ?? sp.pnf?.nombre ?? '—'}</Badge>],
  },
}

function CrudTabWithModals({ config }: { config: typeof entityConfigs[string] }) {
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState<any>(null)
  const [generatingFor, setGeneratingFor] = useState<any>(null)
  const [genNumeroTrayectos, setGenNumeroTrayectos] = useState(4)
  const [genRequierePiu, setGenRequierePiu] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [multipleOpen, setMultipleOpen] = useState(false)
  const [multipleSedePnfOptions, setMultipleSedePnfOptions] = useState<any[]>([])
  const [multipleForm, setMultipleForm] = useState({ nombre: '', fechaInicio: '', fechaFin: '', activo: true })
  const [multipleSedePnfIds, setMultipleSedePnfIds] = useState<string[]>([])
  const [generatingMultiple, setGeneratingMultiple] = useState(false)

  const canEdit = user ? (config.editRoles ?? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR]).includes(user.role) : false
  const canDelete = user?.role === Role.SUPERADMIN
  // Un coordinador administra una sola sede-PNF: no tiene sentido que la elija
  // al crear un período, se le asigna la suya automáticamente. La generación
  // múltiple tampoco aplica (ya la bloquea el backend con 403 para este rol).
  const isCoordinadorPeriodos = config.endpoint === '/periodos' && user?.role === Role.COORDINADOR
  const formFields = isCoordinadorPeriodos ? config.fields.filter((f) => f.name !== 'sedePnfId') : config.fields

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (debouncedSearch && config.searchable !== false) params.q = debouncedSearch
      const res = await api.get(config.endpoint, { params })
      let list = res.data.data ?? res.data
      // GET /tramos solo trae el trayecto anidado, no su PNF; se cruza acá con
      // /trayectos (que sí trae pnf) para mostrar "PNF — Trayecto N" sin pedirle
      // ese join extra al backend.
      if (config.endpoint === '/tramos' && Array.isArray(list)) {
        const trayectosRes = await api.get('/trayectos')
        const trayectosList = trayectosRes.data.data ?? trayectosRes.data
        const trayectoById = new Map(
          (Array.isArray(trayectosList) ? trayectosList : []).map((t: any) => [t.id, t]),
        )
        list = list.map((tr: any) => {
          const trayecto = trayectoById.get(tr.trayectoId) ?? tr.trayecto
          const pnfNombre = trayecto?.pnf?.nombre
          const trayectoNombre = trayecto?.nombre ?? tr.trayectoId
          return { ...tr, _trayectoLabel: pnfNombre ? `${pnfNombre} — ${trayectoNombre}` : trayectoNombre }
        })
      }
      setData(list)
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [config.endpoint, config.searchable, debouncedSearch])

  useEffect(() => { fetchData() }, [fetchData])

  // Para entidades sin filtro de texto en el backend (ver `searchable: false`
  // arriba), se filtra localmente sobre los datos ya cargados.
  const displayData = config.searchable === false && debouncedSearch
    ? (Array.isArray(data) ? data : []).filter((item) => {
        const term = debouncedSearch.toLowerCase()
        return Object.values(item).some((value) => {
          if (typeof value === 'string') return value.toLowerCase().includes(term)
          if (typeof value === 'number') return String(value).includes(term)
          if (value && typeof value === 'object' && 'nombre' in value) {
            return String((value as { nombre?: string }).nombre ?? '').toLowerCase().includes(term)
          }
          return false
        })
      })
    : data

  // Si la entidad define groupLabel (ej. Trayectos por PNF), se ordena por grupo
  // para poder insertar un encabezado de sección antes de cada uno en la tabla.
  const sortedData = config.groupLabel
    ? [...(Array.isArray(displayData) ? displayData : [])].sort((a, b) => config.groupLabel!(a).localeCompare(config.groupLabel!(b)))
    : displayData

  const handleCreate = async (form: Record<string, any>) => {
    const payload = isCoordinadorPeriodos ? { ...form, sedePnfId: user?.sedePnfId } : form
    const res = await api.post(config.endpoint, payload)
    res.data?.advertencias?.forEach((a: string) => toast.warning(a))
    await fetchData()
  }

  const handleEdit = async (form: Record<string, any>) => {
    if (!editing) return
    const payload = isCoordinadorPeriodos ? { ...form, sedePnfId: user?.sedePnfId } : form
    const res = await api.patch(`${config.endpoint}/${editing.id}`, payload)
    res.data?.advertencias?.forEach((a: string) => toast.warning(a))
    await fetchData()
  }

  const handleDelete = async () => {
    if (!deleting) return
    await api.delete(`${config.endpoint}/${deleting.id}`)
    await fetchData()
  }

  const openMultipleDialog = () => {
    setMultipleForm({ nombre: '', fechaInicio: '', fechaFin: '', activo: true })
    setMultipleSedePnfIds([])
    setMultipleOpen(true)
    api.get('/sede-pnf').then((res) => {
      const list = res.data.data ?? res.data
      setMultipleSedePnfOptions(Array.isArray(list) ? list : [])
    }).catch(() => setMultipleSedePnfOptions([]))
  }

  const toggleMultipleSedePnf = (id: string) => {
    setMultipleSedePnfIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const handleGenerarMultiple = async () => {
    if (!multipleForm.nombre || !multipleForm.fechaInicio || !multipleForm.fechaFin || multipleSedePnfIds.length === 0) return
    setGeneratingMultiple(true)
    try {
      const res = await api.post('/periodos/generar', { ...multipleForm, sedePnfIds: multipleSedePnfIds })
      const creadas = res.data?.creadas?.length ?? 0
      const omitidos = res.data?.omitidos ?? []
      toast.success(`Período creado en ${creadas} sede-PNF${omitidos.length ? `, ${omitidos.length} omitida(s)` : ''}.`)
      setMultipleOpen(false)
      await fetchData()
    } finally {
      setGeneratingMultiple(false)
    }
  }

  const handleGenerarEstructura = async () => {
    if (!generatingFor) return
    setGenerating(true)
    try {
      const res = await api.post(`/pnfs/${generatingFor.id}/generar-estructura`, {
        numeroTrayectos: genNumeroTrayectos,
        requierePiu: genRequierePiu,
      })
      const creadas = res.data?.creadas?.length ?? 0
      const omitidos = res.data?.omitidos ?? []
      toast.success(`Estructura generada: ${creadas} elemento(s) creado(s)${omitidos.length ? `, ${omitidos.length} ya existían` : ''}.`)
      setGeneratingFor(null)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">{config.icon}{config.title}</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            {canEdit && config.hasGenerarMultiple && user?.role !== Role.COORDINADOR && (
              <Button size="sm" variant="outline" onClick={openMultipleDialog}>
                <Wand2 className="mr-2 h-4 w-4" />Generar en varias sedes
              </Button>
            )}
            {canEdit && (
              <Button size="sm" onClick={() => { setEditing(null); setModalOpen(true) }}>
                <Plus className="mr-2 h-4 w-4" />Nuevo
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-muted-foreground">Cargando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {config.columns.map((c) => <TableHead key={c} className="font-semibold">{c}</TableHead>)}
                <TableHead className="text-right font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(sortedData) && sortedData.map((item, index) => {
                const groupLabel = config.groupLabel?.(item)
                const previousGroupLabel = config.groupLabel && index > 0 ? config.groupLabel(sortedData[index - 1]) : null
                const showGroupHeader = groupLabel != null && groupLabel !== previousGroupLabel
                return (
                <Fragment key={item.id}>
                {showGroupHeader && (
                  <TableRow key={`group-${groupLabel}`} className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={config.columns.length + 1} className="py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {groupLabel}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow key={item.id}>
                  {config.renderRow(item).map((cell, i) => <TableCell key={i}>{cell}</TableCell>)}
                  <TableCell className="text-right">
                    {canEdit ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(item); setModalOpen(true) }}>Editar</DropdownMenuItem>
                          {config.hasGenerarEstructura && (
                            <DropdownMenuItem onClick={() => { setGeneratingFor(item); setGenNumeroTrayectos(4); setGenRequierePiu(true) }}>
                              <Wand2 className="mr-2 h-4 w-4" />Generar estructura
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(item)}>
                              <Trash2 className="mr-2 h-4 w-4" />Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-xs text-muted-foreground">Solo lectura</span>
                    )}
                  </TableCell>
                </TableRow>
                </Fragment>
              )})}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <EntityFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={editing ? handleEdit : handleCreate}
        title={editing ? `Editar ${config.title}` : `Nuevo ${config.title}`}
        fields={formFields}
        initialData={editing}
        isEditing={!!editing}
      />

      <ConfirmDeleteModal
        open={!!deleting}
        onOpenChange={(v) => { if (!v) setDeleting(null) }}
        onConfirm={handleDelete}
        title={`Eliminar ${config.title}`}
        description={`¿Está seguro de eliminar este registro?`}
      />

      {config.hasGenerarEstructura && (
        <Dialog open={!!generatingFor} onOpenChange={(v) => { if (!v) setGeneratingFor(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generar estructura académica</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Crea los trayectos y tramos que falten para "{generatingFor?.nombre}". Es idempotente: no duplica lo que ya esté creado.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gen-numero-trayectos">Cantidad de trayectos</Label>
                <Input
                  id="gen-numero-trayectos"
                  type="number"
                  min={1}
                  max={6}
                  value={genNumeroTrayectos}
                  onChange={(e) => setGenNumeroTrayectos(Number(e.target.value))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={genRequierePiu} onCheckedChange={(v) => setGenRequierePiu(!!v)} />
                Requiere PIU (Trayecto 0)
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGeneratingFor(null)} disabled={generating}>Cancelar</Button>
              <Button onClick={handleGenerarEstructura} disabled={generating}>
                {generating ? 'Generando...' : 'Generar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {config.hasGenerarMultiple && (
        <Dialog open={multipleOpen} onOpenChange={setMultipleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generar período en varias sede-PNF</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="multi-nombre">Nombre</Label>
                <Input id="multi-nombre" value={multipleForm.nombre} onChange={(e) => setMultipleForm((f) => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="multi-inicio">Fecha inicio</Label>
                  <Input id="multi-inicio" type="date" value={multipleForm.fechaInicio} onChange={(e) => setMultipleForm((f) => ({ ...f, fechaInicio: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="multi-fin">Fecha fin</Label>
                  <Input id="multi-fin" type="date" value={multipleForm.fechaFin} onChange={(e) => setMultipleForm((f) => ({ ...f, fechaFin: e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={multipleForm.activo} onCheckedChange={(v) => setMultipleForm((f) => ({ ...f, activo: !!v }))} />
                Activo
              </label>
              <div className="space-y-2">
                <Label>Sede-PNF ({multipleSedePnfIds.length} seleccionadas)</Label>
                <div className="max-h-48 overflow-y-auto rounded-md border border-input">
                  {multipleSedePnfOptions.map((sp) => (
                    <label key={sp.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer">
                      <Checkbox checked={multipleSedePnfIds.includes(sp.id)} onCheckedChange={() => toggleMultipleSedePnf(sp.id)} />
                      <span>{sp.pnf?.nombre ?? '—'} — {sp.sede?.nombre ?? '—'}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMultipleOpen(false)} disabled={generatingMultiple}>Cancelar</Button>
              <Button
                onClick={handleGenerarMultiple}
                disabled={generatingMultiple || !multipleForm.nombre || !multipleForm.fechaInicio || !multipleForm.fechaFin || multipleSedePnfIds.length === 0}
              >
                {generatingMultiple ? 'Generando...' : 'Generar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}

export function ConfiguracionPage() {
  const { user } = useAuth()
  const isCoordinador = user?.role === Role.COORDINADOR
  const isRector = user?.role === Role.RECTOR
  // Sedes y Sede-PNF son de alcance global (todas las sedes de la institución):
  // un coordinador o rector solo administra la suya, así que esas pestañas no
  // aportan y solo confunden. El backend ya escopa /pnfs, /trayectos y /tramos
  // por jurisdicción, así que esas quedan visibles y muestran automáticamente
  // solo lo que le corresponde a cada quien.
  const showSedeTabs = !isCoordinador && !isRector
  const showPnfsTab = !isCoordinador
  const defaultTab = showSedeTabs ? 'sedes' : showPnfsTab ? 'pnfs' : 'trayectos'

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" subtitle="Gestión de la estructura académica" icon={<Settings className="h-5 w-5" />} />
      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex-wrap">
          {showSedeTabs && <TabsTrigger value="sedes"><Building className="mr-2 h-4 w-4" />Sedes</TabsTrigger>}
          {showPnfsTab && <TabsTrigger value="pnfs"><BookOpen className="mr-2 h-4 w-4" />PNFs</TabsTrigger>}
          {showSedeTabs && <TabsTrigger value="sedePnf"><Building className="mr-2 h-4 w-4" />Sede-PNF</TabsTrigger>}
          <TabsTrigger value="trayectos"><LayoutList className="mr-2 h-4 w-4" />Trayectos</TabsTrigger>
          <TabsTrigger value="tramos"><Clock className="mr-2 h-4 w-4" />Tramos</TabsTrigger>
          <TabsTrigger value="periodos"><Calendar className="mr-2 h-4 w-4" />Períodos</TabsTrigger>
        </TabsList>
        {showSedeTabs && <TabsContent value="sedes" className="mt-4"><CrudTabWithModals config={entityConfigs.sedes} /></TabsContent>}
        {showPnfsTab && <TabsContent value="pnfs" className="mt-4"><CrudTabWithModals config={entityConfigs.pnfs} /></TabsContent>}
        {showSedeTabs && <TabsContent value="sedePnf" className="mt-4"><CrudTabWithModals config={entityConfigs.sedePnf} /></TabsContent>}
        <TabsContent value="trayectos" className="mt-4"><CrudTabWithModals config={entityConfigs.trayectos} /></TabsContent>
        <TabsContent value="tramos" className="mt-4"><CrudTabWithModals config={entityConfigs.tramos} /></TabsContent>
        <TabsContent value="periodos" className="mt-4"><CrudTabWithModals config={entityConfigs.periodos} /></TabsContent>
      </Tabs>
    </div>
  )
}
