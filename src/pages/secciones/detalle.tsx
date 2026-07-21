import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, Layers, Plus, Users, UserPlus, CalendarOff, MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { PageHeader } from "@/components/ui/page-header"
import { ClaseFormModal } from "@/components/forms/clase-form-modal"
import { InscripcionIndividualModal } from "@/components/forms/inscripcion-individual-modal"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type Seccion, type Clase, type PeriodoAcademico, type AlumnoCohorte, type Inscripcion } from "@/types"
import api from "@/config/api"

interface InscripcionMasivaResponse {
  procesados: number
  inscritos: number
  errores: { claseId: string; motivo: string }[]
}

const DIA_LABEL: Record<string, string> = {
  LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado',
}

export function SeccionDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [seccion, setSeccion] = useState<Seccion | null>(null)
  const [clases, setClases] = useState<Clase[]>([])
  const [cohorte, setCohorte] = useState<AlumnoCohorte[]>([])
  const [inscripcionesPorClase, setInscripcionesPorClase] = useState<Record<string, Inscripcion[]>>({})
  const [periodoActivo, setPeriodoActivo] = useState<PeriodoAcademico | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [individualModalOpen, setIndividualModalOpen] = useState(false)
  const [editing, setEditing] = useState<Clase | null>(null)
  const [deleting, setDeleting] = useState<Clase | null>(null)
  const [inscribiendo, setInscribiendo] = useState(false)
  const [resultado, setResultado] = useState<InscripcionMasivaResponse | null>(null)
  const [suspendingClase, setSuspendingClase] = useState<Clase | null>(null)
  const [suspendFecha, setSuspendFecha] = useState("")
  const [suspendMotivo, setSuspendMotivo] = useState("")
  const [suspending, setSuspending] = useState(false)

  const canEdit = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false
  const canDelete = user?.role === Role.SUPERADMIN

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [seccionRes, clasesRes] = await Promise.all([
        api.get(`/secciones/${id}`),
        api.get('/clases', { params: { seccionId: id } }),
      ])
      const seccionData: Seccion = seccionRes.data
      setSeccion(seccionData)
      const clasesList: Clase[] = clasesRes.data.data ?? clasesRes.data
      const clasesArr = Array.isArray(clasesList) ? clasesList : []
      setClases(clasesArr)

      const [periodosRes, cohorteRes, inscripcionesRes] = await Promise.all([
        api.get('/periodos/activo', { params: { sedePnfId: seccionData.sedePnfId } }),
        api.get('/cohortes', { params: { sedePnfId: seccionData.sedePnfId, trayectoId: seccionData.trayectoId, activa: true } }),
        Promise.all(clasesArr.map((c) => api.get('/inscripciones', { params: { claseId: c.id } }))),
      ])

      const periodosList = periodosRes.data.data ?? periodosRes.data
      const periodos = Array.isArray(periodosList) ? periodosList : (periodosList ? [periodosList] : [])
      setPeriodoActivo(periodos[0] ?? null)

      const cohorteList = cohorteRes.data.data ?? cohorteRes.data
      setCohorte(Array.isArray(cohorteList) ? cohorteList : [])

      const inscripcionesMap: Record<string, Inscripcion[]> = {}
      clasesArr.forEach((c, i) => {
        const list = inscripcionesRes[i].data.data ?? inscripcionesRes[i].data
        inscripcionesMap[c.id] = Array.isArray(list) ? list : []
      })
      setInscripcionesPorClase(inscripcionesMap)
    } catch {
      setSeccion(null)
      setClases([])
      setCohorte([])
      setPeriodoActivo(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const gruposPorMateria = useMemo(() => {
    const map = new Map<string, Clase[]>()
    for (const c of clases) {
      map.set(c.ucId, [...(map.get(c.ucId) ?? []), c])
    }
    return Array.from(map.values())
  }, [clases])

  const claseIdsSinAmbiguedad = useMemo(
    () => gruposPorMateria.filter((g) => g.length === 1).map((g) => g[0].id),
    [gruposPorMateria],
  )
  const materiasConSubgrupos = useMemo(
    () => gruposPorMateria.filter((g) => g.length > 1),
    [gruposPorMateria],
  )

  const handleCreate = async (form: Record<string, any>) => {
    await api.post('/clases', { ...form, seccionId: id })
    await fetchData()
  }

  const handleEdit = async (form: Record<string, any>) => {
    if (!editing) return
    await api.patch(`/clases/${editing.id}`, form)
    await fetchData()
  }

  const handleDelete = async () => {
    if (!deleting) return
    await api.delete(`/clases/${deleting.id}`)
    await fetchData()
  }

  const handleInscribirCohorte = async () => {
    if (!seccion || !periodoActivo || claseIdsSinAmbiguedad.length === 0) return
    setInscribiendo(true)
    setResultado(null)
    try {
      const res = await api.post('/inscripciones/masiva', {
        trayectoId: seccion.trayectoId,
        sedePnfId: seccion.sedePnfId,
        periodoId: periodoActivo.id,
        claseIds: claseIdsSinAmbiguedad,
      })
      setResultado(res.data)
      await fetchData()
    } finally {
      setInscribiendo(false)
    }
  }

  const handleInscribirIndividual = async (data: { alumnoId: string; claseIds: string[] }) => {
    const res = await api.post('/inscripciones/batch', data)
    await fetchData()
    return res.data
  }

  const handleDesinscribir = async (inscripcionId: string) => {
    await api.delete(`/inscripciones/${inscripcionId}`)
    await fetchData()
  }

  const handleSuspenderClase = async () => {
    if (!suspendingClase || !suspendFecha || !suspendMotivo) return
    setSuspending(true)
    try {
      await api.post(`/clases/${suspendingClase.id}/suspender`, { fecha: suspendFecha, motivo: suspendMotivo })
      toast.success('Clase suspendida correctamente.')
      setSuspendingClase(null)
      setSuspendFecha("")
      setSuspendMotivo("")
    } finally {
      setSuspending(false)
    }
  }

  const claseNombre = (claseId: string) => {
    const c = clases.find((cl) => cl.id === claseId)
    return c ? `${c.unidadCurricular?.nombre ?? 'Materia'} (${c.nombreGrupo})` : claseId
  }

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Cargando...</div>
  }

  if (!seccion) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/secciones')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Secciones
        </Button>
        <div className="text-center py-10 text-muted-foreground">Sección no encontrada.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/secciones')} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Secciones
      </Button>

      <PageHeader
        title={`Sección ${seccion.codigo}`}
        subtitle={`${seccion.trayecto?.nombre ?? seccion.trayectoId} — ${seccion.sedePnf?.pnf?.nombre ?? ''} (${seccion.sedePnf?.sede?.nombre ?? ''})`}
        icon={<Layers className="h-5 w-5" />}
        actions={canEdit && (
          <>
            <Button variant="outline" onClick={() => setIndividualModalOpen(true)} disabled={clases.length === 0}>
              <UserPlus className="mr-2 h-4 w-4" /> Inscribir alumnos
            </Button>
            <Button variant="outline" onClick={handleInscribirCohorte} disabled={inscribiendo || !periodoActivo || claseIdsSinAmbiguedad.length === 0}>
              <Users className="mr-2 h-4 w-4" /> {inscribiendo ? 'Inscribiendo...' : 'Inscribir cohorte completa'}
            </Button>
            <Button className="bg-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Agregar Clase
            </Button>
          </>
        )}
      />

      <p className="text-sm text-muted-foreground -mt-4">
        Una Sección es una etiqueta administrativa (todo el trayecto de este PNF-sede) — los alumnos no se inscriben en la Sección directamente, se matriculan en cada Clase. "Inscribir cohorte completa" matricula automáticamente a los alumnos de esta cohorte en las materias que tienen un solo grupo; usa "Inscribir alumnos" para materias con varios grupos (por cupo) o para alumnos con materias pendientes de otro trayecto.
      </p>

      {canEdit && !periodoActivo && (
        <div className="rounded-md bg-muted border border-border p-3 text-sm text-muted-foreground">
          No hay período académico activo para esta sede-PNF. Cree uno en Configuración antes de inscribir alumnos.
        </div>
      )}

      {periodoActivo && (
        <p className="text-sm text-muted-foreground">Período activo: <span className="font-medium text-foreground">{periodoActivo.nombre}</span></p>
      )}

      {materiasConSubgrupos.length > 0 && (
        <div className="rounded-md bg-muted border border-border p-3 text-sm text-muted-foreground">
          Estas materias tienen varios grupos y deben asignarse manualmente con "Inscribir alumnos":{' '}
          {materiasConSubgrupos.map((g) => `${g[0].unidadCurricular?.nombre ?? 'Materia'} (${g.length} grupos)`).join(', ')}.
        </div>
      )}

      {resultado && (
        <Card className="border-primary/30">
          <CardContent className="pt-6 space-y-2">
            <p className="text-sm">
              Procesados: <span className="font-semibold">{resultado.procesados}</span> — Inscritos: <span className="font-semibold">{resultado.inscritos}</span>
            </p>
            {resultado.errores.length > 0 && (
              <ul className="text-sm text-muted-foreground list-disc pl-5">
                {resultado.errores.map((e, i) => (
                  <li key={i}>{claseNombre(e.claseId)}: {e.motivo}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <h2 className="text-lg font-semibold">Alumnos de esta cohorte ({cohorte.length})</h2>
          <p className="text-xs text-muted-foreground">Alumnos cuyo trayecto oficial actual coincide con esta sección.</p>
        </CardHeader>
        <CardContent>
          {cohorte.length === 0 ? (
            <p className="text-center py-6 text-sm text-muted-foreground">Ningún alumno tiene esta cohorte como trayecto oficial activo.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Cédula</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohorte.map((ac) => (
                  <TableRow key={ac.id}>
                    <TableCell>{ac.alumno?.nombreCompleto ?? ac.alumnoId}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{ac.alumno?.ci ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <h2 className="text-lg font-semibold">Clases</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {gruposPorMateria.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Esta sección aún no tiene clases.</p>
          )}
          {gruposPorMateria.map((grupo) => (
            <div key={grupo[0].ucId}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium">{grupo[0].unidadCurricular?.nombre ?? '—'}</h3>
                {grupo.length > 1 && <Badge variant="secondary">{grupo.length} grupos</Badge>}
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Grupo</TableHead>
                    <TableHead className="font-semibold">Docente</TableHead>
                    <TableHead className="font-semibold">Día</TableHead>
                    <TableHead className="font-semibold">Hora</TableHead>
                    <TableHead className="font-semibold">Aula</TableHead>
                    <TableHead className="font-semibold">Inscritos</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grupo.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell><Badge variant="secondary" className="font-mono">{c.nombreGrupo}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.docente?.nombreCompleto ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.diaSemana ? DIA_LABEL[c.diaSemana] ?? c.diaSemana : '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.horaInicio && c.horaFin ? `${c.horaInicio} - ${c.horaFin}` : '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.aula ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(inscripcionesPorClase[c.id] ?? []).length === 0 ? '—' : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 px-2">{(inscripcionesPorClase[c.id] ?? []).length} alumno(s)</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {(inscripcionesPorClase[c.id] ?? []).map((ins) => (
                                <DropdownMenuItem key={ins.id} className="flex items-center justify-between gap-4" onSelect={(e) => e.preventDefault()}>
                                  <span>{ins.alumno?.nombreCompleto ?? ins.alumnoId}</span>
                                  {canDelete && (
                                    <button className="text-xs text-destructive" onClick={() => handleDesinscribir(ins.id)}>Quitar</button>
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {canEdit ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditing(c); setModalOpen(true) }}>Editar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSuspendingClase(c); setSuspendFecha(""); setSuspendMotivo("") }}>
                                <CalendarOff className="mr-2 h-4 w-4" />
                                Suspender clase
                              </DropdownMenuItem>
                              {canDelete && (
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(c)}>Eliminar</DropdownMenuItem>
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
            </div>
          ))}
        </CardContent>
      </Card>

      <ClaseFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={editing ? handleEdit : handleCreate}
        trayectoId={seccion.trayectoId}
        sedePnfId={seccion.sedePnfId}
        initialData={editing ? {
          ucId: editing.ucId,
          docenteId: editing.docenteId,
          nombreGrupo: editing.nombreGrupo,
          diaSemana: editing.diaSemana ?? '',
          horaInicio: editing.horaInicio ?? '',
          horaFin: editing.horaFin ?? '',
          aula: editing.aula ?? '',
        } : undefined}
        isEditing={!!editing}
      />

      <InscripcionIndividualModal
        open={individualModalOpen}
        onOpenChange={setIndividualModalOpen}
        onSubmit={handleInscribirIndividual}
        clases={clases}
        sedePnfId={seccion.sedePnfId}
      />

      <ConfirmDeleteModal
        open={!!deleting}
        onOpenChange={(v) => { if (!v) setDeleting(null) }}
        onConfirm={handleDelete}
        title="Eliminar Clase"
        description={`¿Eliminar la clase "${deleting?.unidadCurricular?.nombre} (${deleting?.nombreGrupo})"?`}
      />

      <Dialog open={!!suspendingClase} onOpenChange={(v) => { if (!v) setSuspendingClase(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspender clase</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {suspendingClase?.unidadCurricular?.nombre} ({suspendingClase?.nombreGrupo})
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suspend-fecha">Fecha</Label>
              <Input id="suspend-fecha" type="date" value={suspendFecha} onChange={(e) => setSuspendFecha(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suspend-motivo">Motivo</Label>
              <Input id="suspend-motivo" placeholder="Ej. Feriado nacional" value={suspendMotivo} onChange={(e) => setSuspendMotivo(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendingClase(null)} disabled={suspending}>Cancelar</Button>
            <Button onClick={handleSuspenderClase} disabled={suspending || !suspendFecha || !suspendMotivo}>
              {suspending ? 'Suspendiendo...' : 'Suspender'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
