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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ClaseFormModal } from "@/components/forms/clase-form-modal"
import { InscripcionIndividualModal } from "@/components/forms/inscripcion-individual-modal"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import { WeeklyScheduleGrid, type ScheduleGridEntry } from "@/components/schedule/weekly-schedule-grid"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type Seccion, type Clase, type PeriodoAcademico, type AlumnoCohorte, type Inscripcion, type ClaseSuspendida } from "@/types"
import api from "@/config/api"

interface InscripcionMasivaResponse {
  procesados: number
  alumnosEncontrados: number
  inscritos: number
  yaInscritas: number
  errores: { claseId: string; alumnoId: string; motivo: string }[]
}

const DIA_LABEL: Record<string, string> = {
  LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
}

export function SeccionDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [seccion, setSeccion] = useState<Seccion | null>(null)
  const [clases, setClases] = useState<Clase[]>([])
  // Todas las clases del mismo trayecto+sede-PNF (no solo las de esta Sección) —
  // una materia puede tener sus grupos partidos entre Secciones hermanas (ej.
  // "Programación I" Grupo A en esta Sección y Grupo B en otra), y la inscripción
  // masiva apunta al mismo pool de alumnos sin importar desde cuál se dispare.
  // Se usa solo para calcular ambigüedad (ver gruposPorMateriaTrayecto) — la
  // lista de Clases de esta pantalla sigue mostrando solo `clases`.
  const [clasesDelTrayecto, setClasesDelTrayecto] = useState<Clase[]>([])
  const [cohorte, setCohorte] = useState<AlumnoCohorte[]>([])
  const [inscripcionesPorClase, setInscripcionesPorClase] = useState<Record<string, Inscripcion[]>>({})
  const [suspensionesPorClase, setSuspensionesPorClase] = useState<Record<string, ClaseSuspendida[]>>({})
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
  const [confirmingInscripcionMasiva, setConfirmingInscripcionMasiva] = useState(false)

  const canEdit = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false
  // Dos permisos distintos que antes compartían la misma bandera: desinscribir
  // un alumno (DELETE /inscripciones/:id) ya admite COORDINADOR en el backend
  // desde que ese rol puede gestionar sus propias secciones, pero eliminar la
  // Clase entera (DELETE /clases/:id) sigue siendo solo de SUPERADMIN.
  const canUnenroll = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false
  const canDeleteClase = user?.role === Role.SUPERADMIN

  // NOTA: /inscripciones solo admite filtrar por un único claseId a la vez
  // (no acepta una lista de claseId ni un filtro por seccionId — ver
  // inscripciones.controller.ts / inscripciones.service.ts, ALLOWED_FILTERS),
  // así que sigue haciendo una llamada por cada clase de la sección. No se
  // agrega aquí un filtro que el backend no soporta.
  const fetchInscripcionesYSuspensiones = useCallback(async (clasesArr: Clase[]) => {
    const [inscripcionesRes, suspensionesRes] = await Promise.all([
      Promise.all(clasesArr.map((c) => api.get('/inscripciones', { params: { claseId: c.id } }))),
      Promise.all(clasesArr.map((c) => api.get(`/clases/${c.id}/suspensiones`))),
    ])

    const inscripcionesMap: Record<string, Inscripcion[]> = {}
    clasesArr.forEach((c, i) => {
      const list = inscripcionesRes[i].data.data ?? inscripcionesRes[i].data
      inscripcionesMap[c.id] = Array.isArray(list) ? list : []
    })
    setInscripcionesPorClase(inscripcionesMap)

    const suspensionesMap: Record<string, ClaseSuspendida[]> = {}
    clasesArr.forEach((c, i) => {
      const list = suspensionesRes[i].data.data ?? suspensionesRes[i].data
      suspensionesMap[c.id] = Array.isArray(list) ? list : []
    })
    setSuspensionesPorClase(suspensionesMap)
  }, [])

  // Re-carga solo la lista de clases de la sección (y sus inscripciones/
  // suspensiones), sin volver a pedir sección/cohorte/período — usada tras
  // crear, editar o eliminar una clase, que son las únicas mutaciones que
  // cambian la lista de clases en sí.
  const refreshClases = useCallback(async () => {
    if (!id) return
    const clasesRes = await api.get('/clases', { params: { seccionId: id } })
    const clasesList: Clase[] = clasesRes.data.data ?? clasesRes.data
    const clasesArr = Array.isArray(clasesList) ? clasesList : []
    setClases(clasesArr)
    await fetchInscripcionesYSuspensiones(clasesArr)
    if (seccion) {
      const trayectoRes = await api.get('/clases', { params: { trayectoId: seccion.trayectoId, sedePnfId: seccion.sedePnfId } })
      const trayectoList: Clase[] = trayectoRes.data.data ?? trayectoRes.data
      setClasesDelTrayecto(Array.isArray(trayectoList) ? trayectoList : [])
    }
  }, [id, fetchInscripcionesYSuspensiones, seccion])

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

      const [cohorteRes, trayectoRes] = await Promise.all([
        api.get('/cohortes', { params: { sedePnfId: seccionData.sedePnfId, trayectoId: seccionData.trayectoId, activa: true } }),
        api.get('/clases', { params: { trayectoId: seccionData.trayectoId, sedePnfId: seccionData.sedePnfId } }),
        fetchInscripcionesYSuspensiones(clasesArr),
      ])

      const cohorteList = cohorteRes.data.data ?? cohorteRes.data
      setCohorte(Array.isArray(cohorteList) ? cohorteList : [])
      const trayectoList: Clase[] = trayectoRes.data.data ?? trayectoRes.data
      setClasesDelTrayecto(Array.isArray(trayectoList) ? trayectoList : [])

      // Llamada aislada: un 404 de "sin período activo" es un caso válido (2 de 3
      // sede-PNF no tienen ninguno) y no debe tumbar el resto de la sección.
      try {
        const periodoRes = await api.get('/periodos/activo', { params: { sedePnfId: seccionData.sedePnfId } })
        const periodo: PeriodoAcademico = periodoRes.data
        setPeriodoActivo(periodo)
        periodo.advertencias?.forEach((a) => toast.warning(a))
      } catch (periodoErr: any) {
        setPeriodoActivo(null)
        if (periodoErr?.response?.status !== 404) {
          toast.error('No se pudo cargar el período académico activo.')
        }
      }
    } catch {
      setSeccion(null)
      setClases([])
      setClasesDelTrayecto([])
      setCohorte([])
      setPeriodoActivo(null)
    } finally {
      setLoading(false)
    }
  }, [id, fetchInscripcionesYSuspensiones])

  useEffect(() => { fetchData() }, [fetchData])

  const gruposPorMateria = useMemo(() => {
    const map = new Map<string, Clase[]>()
    for (const c of clases) {
      map.set(c.ucId, [...(map.get(c.ucId) ?? []), c])
    }
    return Array.from(map.values())
  }, [clases])

  // Igual que gruposPorMateria pero sobre TODO el trayecto+sede-PNF, no solo
  // esta Sección — una materia con grupos partidos entre Secciones hermanas
  // (mismo ucId, seccionId distinto) solo se detecta como ambigua mirando más
  // allá de esta Sección. gruposPorMateria sigue intacto para las Cards de
  // Clases de más abajo, que sí deben mostrar solo lo de esta Sección.
  const gruposPorMateriaTrayecto = useMemo(() => {
    const map = new Map<string, Clase[]>()
    for (const c of clasesDelTrayecto) {
      map.set(c.ucId, [...(map.get(c.ucId) ?? []), c])
    }
    return Array.from(map.values())
  }, [clasesDelTrayecto])

  const claseIdsSinAmbiguedad = useMemo(
    () => gruposPorMateriaTrayecto.filter((g) => g.length === 1).map((g) => g[0].id),
    [gruposPorMateriaTrayecto],
  )
  const materiasConSubgrupos = useMemo(
    () => gruposPorMateriaTrayecto.filter((g) => g.length > 1),
    [gruposPorMateriaTrayecto],
  )
  // Sin esto había que sumar a mano la columna "Inscritos" de cada grupo de
  // cada materia para saber cuántos de la cohorte ya están matriculados.
  const nadaQueInscribirMasivamente = claseIdsSinAmbiguedad.length === 0 && gruposPorMateria.length > 0

  // Cuenta en cuántas clases de la sección está inscrito cada alumno, para mostrar
  // el estado de inscripción en la tabla de la cohorte (antes no había forma de saber
  // si un alumno estaba o no inscrito con solo mirar la tabla).
  const clasesInscritasPorAlumno = useMemo(() => {
    const map = new Map<string, number>()
    Object.values(inscripcionesPorClase).forEach((list) => {
      list.forEach((ins) => {
        map.set(ins.alumnoId, (map.get(ins.alumnoId) ?? 0) + 1)
      })
    })
    return map
  }, [inscripcionesPorClase])

  const inscritosCount = useMemo(
    () => cohorte.filter((ac) => (clasesInscritasPorAlumno.get(ac.alumnoId) ?? 0) > 0).length,
    [cohorte, clasesInscritasPorAlumno],
  )
  const sinInscribirCount = cohorte.length - inscritosCount

  const scheduleEntries = useMemo<ScheduleGridEntry[]>(
    () =>
      clases
        .filter((c) => c.diaSemana && c.horaInicio && c.horaFin)
        .map((c) => ({
          id: c.id,
          diaSemana: c.diaSemana as string,
          horaInicio: c.horaInicio as string,
          horaFin: c.horaFin as string,
          materia: c.unidadCurricular?.nombre ?? 'Materia',
          docente: c.docente?.nombreCompleto,
          grupo: c.nombreGrupo,
          aula: c.aula,
        })),
    [clases],
  )

  const handleCreate = async (form: Record<string, any>) => {
    await api.post('/clases', { ...form, seccionId: id })
    await refreshClases()
  }

  const handleEdit = async (form: Record<string, any>) => {
    if (!editing) return
    await api.patch(`/clases/${editing.id}`, form)
    await refreshClases()
  }

  const handleDelete = async () => {
    if (!deleting) return
    await api.delete(`/clases/${deleting.id}`)
    await refreshClases()
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
      await fetchInscripcionesYSuspensiones(clases)
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'No se pudo inscribir la cohorte.')
    } finally {
      setInscribiendo(false)
    }
  }

  const handleInscribirIndividual = async (data: { alumnoId: string; claseIds: string[] }) => {
    const res = await api.post('/inscripciones/batch', data)
    await fetchInscripcionesYSuspensiones(clases)
    return res.data
  }

  const handleDesinscribir = async (inscripcionId: string) => {
    await api.delete(`/inscripciones/${inscripcionId}`)
    // Actualiza solo el estado local: ya sabemos qué inscripción se quitó,
    // no hace falta re-pedir todo al servidor.
    setInscripcionesPorClase((prev) => {
      const next: Record<string, Inscripcion[]> = {}
      for (const [claseId, list] of Object.entries(prev)) {
        next[claseId] = list.filter((ins) => ins.id !== inscripcionId)
      }
      return next
    })
  }

  const handleSuspenderClase = async () => {
    if (!suspendingClase || !suspendFecha || !suspendMotivo) return
    setSuspending(true)
    try {
      const res = await api.post(`/clases/${suspendingClase.id}/suspender`, { fecha: suspendFecha, motivo: suspendMotivo })
      const nuevaSuspension: ClaseSuspendida = res.data
      // Actualiza solo la clase suspendida en vez de recargar todo.
      setSuspensionesPorClase((prev) => ({
        ...prev,
        [suspendingClase.id]: [...(prev[suspendingClase.id] ?? []), nuevaSuspension],
      }))
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

  const alumnoNombre = (alumnoId: string) => {
    const ac = cohorte.find((a) => a.alumnoId === alumnoId)
    return ac?.alumno?.nombreCompleto ?? alumnoId
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
            <Button variant="outline" onClick={() => setConfirmingInscripcionMasiva(true)} disabled={inscribiendo || !periodoActivo || claseIdsSinAmbiguedad.length === 0}>
              <Users className="mr-2 h-4 w-4" /> {inscribiendo ? 'Inscribiendo...' : 'Inscribir cohorte completa'}
            </Button>
            <Button className="bg-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Agregar Clase
            </Button>
          </>
        )}
      />

      <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 text-center">
          <p className="text-2xl font-bold tabular-nums">{cohorte.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">En cohorte</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-2xl font-bold tabular-nums text-success">{inscritosCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Inscritos</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-2xl font-bold tabular-nums text-muted-foreground">{sinInscribirCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Sin inscribir</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Una Sección es una etiqueta administrativa (todo el trayecto de este PNF-sede) — los alumnos no se inscriben en la Sección directamente, se matriculan en cada Clase. "Inscribir cohorte completa" matricula automáticamente a los alumnos de esta cohorte en las materias que tienen un solo grupo; usa "Inscribir alumnos" para materias con varios grupos (por cupo) o para alumnos con materias pendientes de otro trayecto.
      </p>

      {canEdit && !periodoActivo && (
        <div className="rounded-md bg-muted border border-border p-3 text-sm text-muted-foreground">
          No hay período académico activo para esta sede-PNF. Cree uno en Configuración antes de inscribir alumnos.
        </div>
      )}

      {canEdit && periodoActivo && nadaQueInscribirMasivamente && (
        <div className="rounded-md bg-muted border border-border p-3 text-sm text-muted-foreground">
          "Inscribir cohorte completa" está deshabilitado porque ninguna materia de esta sección tiene un solo grupo — todas necesitan elegir grupo a mano. Use "Inscribir alumnos" para matricularlos.
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
              Alumnos encontrados: <span className="font-semibold">{resultado.alumnosEncontrados}</span> — Procesados: <span className="font-semibold">{resultado.procesados}</span> — Inscritos: <span className="font-semibold">{resultado.inscritos}</span> — Ya inscritos: <span className="font-semibold">{resultado.yaInscritas}</span>
            </p>
            {resultado.errores.length > 0 && (
              <ul className="text-sm text-muted-foreground list-disc pl-5">
                {resultado.errores.map((e, i) => (
                  <li key={i}>{alumnoNombre(e.alumnoId)} — {claseNombre(e.claseId)}: {e.motivo}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <h2 className="text-lg font-semibold">Alumnos de esta cohorte ({cohorte.length})</h2>
          <p className="text-xs text-muted-foreground">Alumnos cuyo trayecto oficial actual coincide con esta sección. La columna Estado indica si ya están inscritos en las clases (pertenecer a la cohorte no es lo mismo que estar inscrito).</p>
        </CardHeader>
        <CardContent>
          {cohorte.length === 0 ? (
            <p className="text-center py-6 text-sm text-muted-foreground">Ningún alumno tiene esta cohorte como trayecto oficial activo.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Alumno</TableHead>
                  <TableHead className="font-semibold">Cédula</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohorte.map((ac) => {
                  const inscritas = clasesInscritasPorAlumno.get(ac.alumnoId) ?? 0
                  return (
                    <TableRow key={ac.id}>
                      <TableCell className="font-medium">{ac.alumno?.nombreCompleto ?? ac.alumnoId}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ac.alumno?.ci ?? '—'}</TableCell>
                      <TableCell>
                        {inscritas > 0 ? (
                          <Badge className="bg-success/15 text-success hover:bg-success/15">
                            Inscrito{clases.length > 0 ? ` (${inscritas}/${clases.length})` : ''}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Sin inscribir</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
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
          {gruposPorMateria.length > 0 && (
            <Tabs defaultValue="lista">
              <TabsList>
                <TabsTrigger value="lista">Lista</TabsTrigger>
                <TabsTrigger value="grilla">Grilla semanal</TabsTrigger>
              </TabsList>
              <TabsContent value="grilla">
                <WeeklyScheduleGrid
                  entries={scheduleEntries}
                  emptyMessage="Ninguna clase de esta sección tiene día/hora asignados todavía."
                />
              </TabsContent>
              <TabsContent value="lista">
                <div className="space-y-6">
                  {gruposPorMateria.map((grupo) => (
                    <Card key={grupo[0].ucId}>
                      <CardContent className="pt-6">
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
                                <TableCell>
                                  <Badge variant="secondary" className="font-mono">{c.nombreGrupo}</Badge>
                                  {(suspensionesPorClase[c.id] ?? []).length > 0 && (
                                    <Badge variant="destructive" className="ml-1">
                                      {(suspensionesPorClase[c.id] ?? []).length} suspendida(s)
                                    </Badge>
                                  )}
                                </TableCell>
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
                                            {canUnenroll && (
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
                                        {canDeleteClase && (
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
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
        clases={clasesDelTrayecto}
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

      <Dialog open={confirmingInscripcionMasiva} onOpenChange={setConfirmingInscripcionMasiva}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar inscripción masiva</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se va a intentar inscribir a <span className="font-semibold text-foreground">{cohorte.length}</span> alumno(s) de la cohorte en <span className="font-semibold text-foreground">{claseIdsSinAmbiguedad.length}</span> clase(s) sin ambigüedad de grupo (considerando todo el trayecto, no solo esta Sección).
          </p>
          {materiasConSubgrupos.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Quedan afuera de este paso, por tener más de un grupo, y deben asignarse a mano con "Inscribir alumnos": {materiasConSubgrupos.map((g) => `${g[0].unidadCurricular?.nombre ?? 'Materia'} (${g.length} grupos)`).join(', ')}.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingInscripcionMasiva(false)} disabled={inscribiendo}>Cancelar</Button>
            <Button
              onClick={() => { setConfirmingInscripcionMasiva(false); handleInscribirCohorte() }}
              disabled={inscribiendo}
            >
              {inscribiendo ? 'Inscribiendo...' : 'Confirmar e inscribir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
