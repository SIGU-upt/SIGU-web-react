import { useState, useEffect, useCallback } from "react"
import { Settings, Search, Plus, Trash2, Building, BookOpen, LayoutList, Clock, MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/ui/page-header"
import { EntityFormModal, type EntityField } from "@/components/forms/entity-form-modal"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import { useAuth } from "@/contexts/AuthContext"
import { Role } from "@/types"
import api from "@/config/api"

const entityConfigs: Record<string, { title: string; icon: React.ReactNode; endpoint: string; fields: EntityField[]; columns: string[]; renderRow: (item: any) => React.ReactNode[]; editRoles?: Role[] }> = {
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
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'codigo', label: 'Código', required: true },
    ],
    columns: ['Nombre', 'Código'],
    renderRow: (p) => [p.nombre, <Badge variant="secondary" className="font-mono">{p.codigo}</Badge>],
  },
  trayectos: {
    title: 'Trayectos', icon: <LayoutList className="h-5 w-5" />, endpoint: '/trayectos',
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'numero', label: 'Número (0=PIU, 1-4)', required: true, type: 'number' as const },
      { name: 'pnfId', label: 'PNF', required: true, type: 'select' as const, optionsEndpoint: '/pnfs', optionLabel: (p: any) => p.nombre, optionValue: (p: any) => p.id },
    ],
    columns: ['Nombre', 'Número'],
    renderRow: (t) => [t.nombre, <Badge variant="secondary">{t.numero}</Badge>],
  },
  tramos: {
    title: 'Tramos', icon: <Clock className="h-5 w-5" />, endpoint: '/tramos',
    fields: [
      { name: 'numero', label: 'Número (1-3)', required: true, type: 'number' as const },
      { name: 'trayectoId', label: 'Trayecto', required: true, type: 'select' as const, optionsEndpoint: '/trayectos', optionLabel: (t: any) => t.nombre, optionValue: (t: any) => t.id },
      { name: 'isPer', label: 'Es PER', type: 'checkbox' as const },
      { name: 'fechaInicio', label: 'Fecha inicio (opcional)', type: 'date' as const, required: false },
      { name: 'fechaFin', label: 'Fecha fin (opcional)', type: 'date' as const, required: false },
    ],
    columns: ['Número', 'PER'],
    renderRow: (t) => [
      <span className="font-medium">{t.numero}</span>,
      <Badge variant={t.isPer ? 'default' : 'secondary'}>{t.isPer ? 'Sí' : 'No'}</Badge>,
    ],
  },
  sedePnf: {
    title: 'Sede-PNF', icon: <Building className="h-5 w-5" />, endpoint: '/sede-pnf',
    editRoles: [Role.SUPERADMIN, Role.RECTOR],
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
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState<any>(null)

  const canEdit = user ? (config.editRoles ?? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR]).includes(user.role) : false
  const canDelete = user?.role === Role.SUPERADMIN

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search) params.q = search
      const res = await api.get(config.endpoint, { params })
      setData(res.data.data ?? res.data)
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [config.endpoint, search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async (form: Record<string, any>) => {
    await api.post(config.endpoint, form)
    await fetchData()
  }

  const handleEdit = async (form: Record<string, any>) => {
    if (!editing) return
    await api.patch(`${config.endpoint}/${editing.id}`, form)
    await fetchData()
  }

  const handleDelete = async () => {
    if (!deleting) return
    await api.delete(`${config.endpoint}/${deleting.id}`)
    await fetchData()
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
              {Array.isArray(data) && data.map((item) => (
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
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <EntityFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={editing ? handleEdit : handleCreate}
        title={editing ? `Editar ${config.title}` : `Nuevo ${config.title}`}
        fields={config.fields}
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
    </Card>
  )
}

export function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" subtitle="Gestión de la estructura académica" icon={<Settings className="h-5 w-5" />} />
      <Tabs defaultValue="sedes">
        <TabsList className="flex-wrap">
          <TabsTrigger value="sedes"><Building className="mr-2 h-4 w-4" />Sedes</TabsTrigger>
          <TabsTrigger value="pnfs"><BookOpen className="mr-2 h-4 w-4" />PNFs</TabsTrigger>
          <TabsTrigger value="sedePnf"><Building className="mr-2 h-4 w-4" />Sede-PNF</TabsTrigger>
          <TabsTrigger value="trayectos"><LayoutList className="mr-2 h-4 w-4" />Trayectos</TabsTrigger>
          <TabsTrigger value="tramos"><Clock className="mr-2 h-4 w-4" />Tramos</TabsTrigger>
        </TabsList>
        <TabsContent value="sedes" className="mt-4"><CrudTabWithModals config={entityConfigs.sedes} /></TabsContent>
        <TabsContent value="pnfs" className="mt-4"><CrudTabWithModals config={entityConfigs.pnfs} /></TabsContent>
        <TabsContent value="sedePnf" className="mt-4"><CrudTabWithModals config={entityConfigs.sedePnf} /></TabsContent>
        <TabsContent value="trayectos" className="mt-4"><CrudTabWithModals config={entityConfigs.trayectos} /></TabsContent>
        <TabsContent value="tramos" className="mt-4"><CrudTabWithModals config={entityConfigs.tramos} /></TabsContent>
      </Tabs>
    </div>
  )
}
