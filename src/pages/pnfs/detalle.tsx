import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, BookOpen, Plus, MoreVertical, Wand2, Layers, Users, GraduationCap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { PageHeader } from "@/components/ui/page-header"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { EntityFormModal, type EntityField } from "@/components/forms/entity-form-modal"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type Pnf, type Trayecto, type Tramo, type Seccion, type User } from "@/types"
import api from "@/config/api"

const trayectoFields: EntityField[] = [
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'numero', label: 'Número (0=PIU, 1-4)', required: true, type: 'number' },
]

const tramoFields: EntityField[] = [
  { name: 'numero', label: 'Número (1-3)', required: true, type: 'number' },
  { name: 'isPer', label: 'Es PER', type: 'checkbox' },
  { name: 'fechaInicio', label: 'Fecha inicio (opcional)', type: 'date', required: false },
  { name: 'fechaFin', label: 'Fecha fin (opcional)', type: 'date', required: false },
]

export function PnfDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [pnf, setPnf] = useState<Pnf | null>(null)
  const [trayectos, setTrayectos] = useState<Trayecto[]>([])
  const [tramosPorTrayecto, setTramosPorTrayecto] = useState<Record<string, Tramo[]>>({})
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [docentes, setDocentes] = useState<User[]>([])
  const [alumnos, setAlumnos] = useState<User[]>([])
  const [alumnosMeta, setAlumnosMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [alumnosPage, setAlumnosPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [trayectoModalOpen, setTrayectoModalOpen] = useState(false)
  const [editingTrayecto, setEditingTrayecto] = useState<Trayecto | null>(null)
  const [deletingTrayecto, setDeletingTrayecto] = useState<Trayecto | null>(null)
  const [tramoModalOpen, setTramoModalOpen] = useState(false)
  const [tramoTrayectoId, setTramoTrayectoId] = useState<string | null>(null)
  const [editingTramo, setEditingTramo] = useState<Tramo | null>(null)
  const [deletingTramo, setDeletingTramo] = useState<Tramo | null>(null)
  const [generatingEstructura, setGeneratingEstructura] = useState(false)
  const [genNumeroTrayectos, setGenNumeroTrayectos] = useState(4)
  const [genRequierePiu, setGenRequierePiu] = useState(true)
  const [generating, setGenerating] = useState(false)

  const canEdit = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false
  const canDelete = user?.role === Role.SUPERADMIN

  const fetchTramos = useCallback(async (trayectosList: Trayecto[]) => {
    const entries = await Promise.all(
      trayectosList.map(async (t) => {
        const res = await api.get('/tramos', { params: { trayectoId: t.id } })
        const list = res.data.data ?? res.data
        return [t.id, Array.isArray(list) ? list : []] as const
      }),
    )
    setTramosPorTrayecto(Object.fromEntries(entries))
  }, [])

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [pnfRes, trayectosRes, seccionesRes, docentesRes, alumnosRes] = await Promise.all([
        api.get(`/pnfs/${id}`),
        api.get('/trayectos', { params: { pnfId: id } }),
        api.get('/secciones', { params: { pnfId: id } }),
        api.get('/users', { params: { role: 'DOCENTE', pnfId: id, limit: 200 } }),
        api.get('/users', { params: { role: 'ALUMNO', pnfId: id, page: alumnosPage, limit: 20 } }),
      ])
      setPnf(pnfRes.data)
      const trayectosList = trayectosRes.data.data ?? trayectosRes.data
      setTrayectos(Array.isArray(trayectosList) ? trayectosList : [])
      setSecciones(seccionesRes.data.data ?? seccionesRes.data ?? [])
      setDocentes(docentesRes.data.data ?? docentesRes.data ?? [])
      setAlumnos(alumnosRes.data.data ?? [])
      if (alumnosRes.data.meta) setAlumnosMeta(alumnosRes.data.meta)
      await fetchTramos(Array.isArray(trayectosList) ? trayectosList : [])
    } catch {
      setPnf(null)
    } finally {
      setLoading(false)
    }
  }, [id, alumnosPage, fetchTramos])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreateTrayecto = async (data: Record<string, any>) => {
    await api.post('/trayectos', { ...data, pnfId: id })
    await fetchData()
  }
  const handleEditTrayecto = async (data: Record<string, any>) => {
    if (!editingTrayecto) return
    await api.patch(`/trayectos/${editingTrayecto.id}`, data)
    await fetchData()
  }
  const handleDeleteTrayecto = async () => {
    if (!deletingTrayecto) return
    await api.delete(`/trayectos/${deletingTrayecto.id}`)
    await fetchData()
  }

  const handleCreateTramo = async (data: Record<string, any>) => {
    if (!tramoTrayectoId) return
    await api.post('/tramos', { ...data, trayectoId: tramoTrayectoId })
    await fetchData()
  }
  const handleEditTramo = async (data: Record<string, any>) => {
    if (!editingTramo) return
    await api.patch(`/tramos/${editingTramo.id}`, data)
    await fetchData()
  }
  const handleDeleteTramo = async () => {
    if (!deletingTramo) return
    await api.delete(`/tramos/${deletingTramo.id}`)
    await fetchData()
  }

  const handleGenerarEstructura = async () => {
    if (!id) return
    setGenerating(true)
    try {
      const res = await api.post(`/pnfs/${id}/generar-estructura`, {
        numeroTrayectos: genNumeroTrayectos,
        requierePiu: genRequierePiu,
      })
      const creadas = res.data?.creadas?.length ?? 0
      const omitidos = res.data?.omitidos ?? []
      toast.success(`Estructura generada: ${creadas} elemento(s) creado(s)${omitidos.length ? `, ${omitidos.length} ya existían` : ''}.`)
      setGeneratingEstructura(false)
      await fetchData()
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Cargando...</div>
  }

  if (!pnf) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/configuracion')} className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="text-center py-10 text-muted-foreground">PNF no encontrado.</div>
      </div>
    )
  }

  const seccionesPorTrayecto = new Map<string, Seccion[]>()
  for (const s of secciones) {
    seccionesPorTrayecto.set(s.trayectoId, [...(seccionesPorTrayecto.get(s.trayectoId) ?? []), s])
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/configuracion')} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Configuración
      </Button>

      <PageHeader
        title={pnf.nombre}
        subtitle={`Código ${pnf.codigo}`}
        icon={<BookOpen className="h-5 w-5" />}
        actions={canEdit && (
          <>
            <Button variant="outline" onClick={() => setGeneratingEstructura(true)}>
              <Wand2 className="mr-2 h-4 w-4" /> Generar estructura
            </Button>
            <Button onClick={() => { setEditingTrayecto(null); setTrayectoModalOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Trayecto
            </Button>
          </>
        )}
      />

      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg"><Layers className="h-5 w-5" /> Trayectos y tramos</CardTitle>
        </CardHeader>
        <CardContent>
          {trayectos.length === 0 ? (
            <p className="text-center py-6 text-sm text-muted-foreground">Este PNF todavía no tiene trayectos.</p>
          ) : (
            <Accordion type="multiple">
              {trayectos.map((t) => {
                const tramos = tramosPorTrayecto[t.id] ?? []
                const seccionesDelTrayecto = seccionesPorTrayecto.get(t.id) ?? []
                return (
                  <AccordionItem key={t.id} value={t.id}>
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        {t.nombre}
                        <Badge variant="secondary">{seccionesDelTrayecto.length} sección(es)</Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tramos</span>
                        {canEdit && (
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { setTramoTrayectoId(t.id); setEditingTramo(null); setTramoModalOpen(true) }}>
                              <Plus className="mr-1 h-3.5 w-3.5" /> Tramo
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setEditingTrayecto(t); setTrayectoModalOpen(true) }}>Editar</Button>
                            {canDelete && (
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeletingTrayecto(t)}>Eliminar</Button>
                            )}
                          </div>
                        )}
                      </div>
                      {tramos.length === 0 ? (
                        <p className="text-sm text-muted-foreground mb-3">Sin tramos.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tramo</TableHead>
                              <TableHead>Vigencia</TableHead>
                              {canEdit && <TableHead className="text-right">Acciones</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tramos.map((tr) => (
                              <TableRow key={tr.id}>
                                <TableCell><Badge variant={tr.isPer ? 'default' : 'secondary'}>{tr.isPer ? 'PER' : `Tramo ${tr.numero}`}</Badge></TableCell>
                                <TableCell className="text-sm text-muted-foreground">{tr.fechaInicio && tr.fechaFin ? `${tr.fechaInicio} — ${tr.fechaFin}` : '—'}</TableCell>
                                {canEdit && (
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { setTramoTrayectoId(t.id); setEditingTramo(tr); setTramoModalOpen(true) }}>Editar</DropdownMenuItem>
                                        {canDelete && (
                                          <DropdownMenuItem className="text-destructive" onClick={() => setDeletingTramo(tr)}>Eliminar</DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                      {seccionesDelTrayecto.length > 0 && (
                        <>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Secciones</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {seccionesDelTrayecto.map((s) => (
                              <Link key={s.id} to={`/secciones/${s.id}`}>
                                <Badge variant="outline" className="cursor-pointer hover:bg-accent">{s.codigo}</Badge>
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5" /> Docentes ({docentes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {docentes.length === 0 ? (
            <p className="text-center py-4 text-sm text-muted-foreground">Sin docentes en este PNF.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Nombre</TableHead><TableHead>Cédula</TableHead><TableHead>Email</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {docentes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.nombreCompleto}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.ci}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg"><GraduationCap className="h-5 w-5" /> Alumnos ({alumnosMeta.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {alumnos.length === 0 ? (
            <p className="text-center py-4 text-sm text-muted-foreground">Sin alumnos en este PNF.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Nombre</TableHead><TableHead>Cédula</TableHead><TableHead>Trayecto actual</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {alumnos.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.nombreCompleto}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.ci}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.trayectoActual?.nombre ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={alumnosMeta.page}
                totalPages={alumnosMeta.totalPages}
                totalItems={alumnosMeta.total}
                startIndex={(alumnosMeta.page - 1) * alumnosMeta.limit}
                endIndex={(alumnosMeta.page - 1) * alumnosMeta.limit + alumnos.length}
                onPageChange={setAlumnosPage}
                label="alumnos"
              />
            </>
          )}
        </CardContent>
      </Card>

      <EntityFormModal
        open={trayectoModalOpen}
        onOpenChange={setTrayectoModalOpen}
        onSubmit={editingTrayecto ? handleEditTrayecto : handleCreateTrayecto}
        title={editingTrayecto ? 'Editar Trayecto' : 'Nuevo Trayecto'}
        fields={trayectoFields}
        initialData={editingTrayecto ?? undefined}
        isEditing={!!editingTrayecto}
      />
      <ConfirmDeleteModal
        open={!!deletingTrayecto}
        onOpenChange={(v) => { if (!v) setDeletingTrayecto(null) }}
        onConfirm={handleDeleteTrayecto}
        title="Eliminar Trayecto"
        description={`¿Eliminar "${deletingTrayecto?.nombre}"? Arrastra sus tramos, unidades curriculares, secciones y clases.`}
      />

      <EntityFormModal
        open={tramoModalOpen}
        onOpenChange={setTramoModalOpen}
        onSubmit={editingTramo ? handleEditTramo : handleCreateTramo}
        title={editingTramo ? 'Editar Tramo' : 'Nuevo Tramo'}
        fields={tramoFields}
        initialData={editingTramo ?? undefined}
        isEditing={!!editingTramo}
      />
      <ConfirmDeleteModal
        open={!!deletingTramo}
        onOpenChange={(v) => { if (!v) setDeletingTramo(null) }}
        onConfirm={handleDeleteTramo}
        title="Eliminar Tramo"
        description="¿Eliminar este tramo?"
      />

      <Dialog open={generatingEstructura} onOpenChange={setGeneratingEstructura}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar estructura académica</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Crea los trayectos y tramos que falten. Es idempotente: no duplica lo que ya esté creado.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gen-numero-trayectos">Cantidad de trayectos</Label>
              <Input id="gen-numero-trayectos" type="number" min={1} max={6} value={genNumeroTrayectos} onChange={(e) => setGenNumeroTrayectos(Number(e.target.value))} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={genRequierePiu} onCheckedChange={(v) => setGenRequierePiu(!!v)} />
              Requiere PIU (Trayecto 0)
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGeneratingEstructura(false)} disabled={generating}>Cancelar</Button>
            <Button onClick={handleGenerarEstructura} disabled={generating}>{generating ? 'Generando...' : 'Generar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
