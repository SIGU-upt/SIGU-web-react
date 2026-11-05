import { Fragment, useState, useCallback, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { GraduationCap, ChevronDown, ChevronRight, UserMinus, CalendarClock, Search } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/ui/page-header"
import { coincideSinAcentos } from "@/lib/texto"
import { RetirarMatriculaModal } from "@/components/forms/retirar-matricula-modal"
import { AsistenteCierrePeriodoModal } from "@/components/forms/asistente-cierre-periodo-modal"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type AlumnoCohorte } from "@/types"
import api from "@/config/api"
import { toast } from "sonner"
import { TextoTruncado } from "@/components/ui/texto-truncado"
import { ListSkeleton } from "@/components/ui/table-skeleton"

// 28/10/2026: esta pantalla mostraba "cohortes" como grupos con nombre y
// cupo propios (entidad `Cohorte`, aparte de la matrícula). Se quitó esa
// capa — no era una necesidad real de la universidad y hacía el modelo
// difícil de explicar — así que ahora agrupa las matrículas reales
// (sede-PNF × trayecto × período) solo para mostrarlas, sin nombre ni cupo.
// El tipo `AlumnoCohorte` (types/index.ts) conserva ese nombre porque
// coincide con la entidad/tabla real del backend; lo que cambió es el
// nombre que ve el usuario, aquí y en el resto de la UI.
interface Grupo {
  clave: string
  sedePnfId: string
  trayectoId: string
  periodoId: string
  sedeNombre: string
  pnfNombre: string
  trayectoNombre: string
  periodoNombre: string
  miembros: AlumnoCohorte[]
}

export function MatriculasPage() {
  const { user } = useAuth()
  // Preselecciona la búsqueda cuando se llega desde "Inconsistencias" (acción
  // directa por fila: Ver matrícula → /matriculas?q=<cédula>).
  const [searchParams] = useSearchParams()
  const [matriculas, setMatriculas] = useState<AlumnoCohorte[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [search, setSearch] = useState(() => searchParams.get('q') ?? "")
  const [retirando, setRetirando] = useState<AlumnoCohorte | null>(null)
  const [cerrandoPeriodo, setCerrandoPeriodo] = useState(false)

  const canGestionar = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false

  // El backend limita `limit` a 200 por página (pagination.dto.ts) — un
  // `limit: 500` directo lo rechaza con 400 y esta pantalla (sin paginación
  // propia, agrupa TODAS las matrículas) se quedaba mostrando "No hay
  // matrículas registradas todavía" aunque sí las había. Se trae página por
  // página hasta agotarlas.
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const todas: AlumnoCohorte[] = []
      let page = 1
      let totalPages = 1
      do {
        const res = await api.get('/matriculas', { params: { page, limit: 200 } })
        const list: AlumnoCohorte[] = res.data.data ?? res.data
        todas.push(...(Array.isArray(list) ? list : []))
        totalPages = res.data.meta?.totalPages ?? 1
        page += 1
      } while (page <= totalPages)
      setMatriculas(todas)
    } catch {
      setMatriculas([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const grupos = useMemo<Grupo[]>(() => {
    const porClave = new Map<string, Grupo>()
    for (const m of matriculas) {
      const clave = `${m.sedePnfId}|${m.trayectoId}|${m.periodoId}`
      let g = porClave.get(clave)
      if (!g) {
        g = {
          clave,
          sedePnfId: m.sedePnfId,
          trayectoId: m.trayectoId,
          periodoId: m.periodoId,
          sedeNombre: m.sedePnf?.sede?.nombre ?? '—',
          pnfNombre: m.sedePnf?.pnf?.nombre ?? '—',
          trayectoNombre: m.trayecto?.nombre ?? '—',
          periodoNombre: m.periodo?.nombre ?? '—',
          miembros: [],
        }
        porClave.set(clave, g)
      }
      g.miembros.push(m)
    }
    return Array.from(porClave.values()).sort((a, b) => b.miembros.length - a.miembros.length)
  }, [matriculas])

  // Client-side a propósito: todas las matrículas ya están cargadas en
  // memoria (ver comentario de fetchData) — sin esto, la única forma de
  // ubicar a un alumno era expandir cada grupo sede-PNF × trayecto × período
  // a mano hasta encontrarlo. Al buscar, el grupo que tiene coincidencias se
  // expande solo, sin que el usuario tenga que hacer clic.
  const buscando = search.trim().length > 0
  const gruposFiltrados = useMemo<Grupo[]>(() => {
    if (!buscando) return grupos
    return grupos
      .map((g) => ({
        ...g,
        miembros: g.miembros.filter(
          (m) => coincideSinAcentos(m.alumno?.nombreCompleto, search) || coincideSinAcentos(m.alumno?.ci, search),
        ),
      }))
      .filter((g) => g.miembros.length > 0)
  }, [grupos, search, buscando])

  const handleRetirar = async (retiroData: { motivo: string; fecha?: string }) => {
    if (!retirando) return
    await api.patch(`/matriculas/${retirando.id}/retirar`, retiroData)
    toast.success('Alumno retirado')
    await fetchData()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matrículas"
        subtitle="Matrículas agrupadas por sede-PNF, trayecto y período"
        icon={<GraduationCap className="h-5 w-5" />}
        actions={canGestionar ? (
          <Button variant="outline" onClick={() => setCerrandoPeriodo(true)} data-tour="matriculas-cierre-periodo">
            <CalendarClock className="mr-2 h-4 w-4" />
            Cierre de Período
          </Button>
        ) : undefined}
      />
      <Card className="shadow-md" data-tour="matriculas-tabla">
        <CardHeader className="pb-2">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar alumno por nombre o cédula..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ListSkeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-8" />
                  <TableHead className="font-semibold">Sede / PNF</TableHead>
                  <TableHead className="font-semibold">Trayecto</TableHead>
                  <TableHead className="font-semibold">Período</TableHead>
                  <TableHead className="font-semibold">Alumnos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gruposFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {buscando ? `Sin alumnos que coincidan con "${search.trim()}".` : 'No hay matrículas registradas todavía.'}
                    </TableCell>
                  </TableRow>
                )}
                {gruposFiltrados.map((g) => {
                  const expandido = buscando || expandedKey === g.clave
                  return (
                  <Fragment key={g.clave}>
                    <TableRow className="cursor-pointer" onClick={() => setExpandedKey(expandedKey === g.clave ? null : g.clave)}>
                      <TableCell>
                        {expandido ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="font-medium">{g.sedeNombre} · {g.pnfNombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{g.trayectoNombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{g.periodoNombre}</TableCell>
                      <TableCell className="text-sm">{g.miembros.filter((m) => m.activa).length} activos / {g.miembros.length} totales</TableCell>
                    </TableRow>
                    {expandido && (
                      <TableRow key={`${g.clave}-detalle`}>
                        <TableCell colSpan={5} className="bg-muted/70 p-0">
                          <div className="p-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Alumno</TableHead>
                                  <TableHead>Cédula</TableHead>
                                  <TableHead>Estado</TableHead>
                                  {canGestionar && <TableHead className="text-right">Acciones</TableHead>}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {g.miembros.map((m) => (
                                  <TableRow key={m.id}>
                                    <TableCell className="text-sm"><TextoTruncado texto={m.alumno?.nombreCompleto ?? m.alumnoId} /></TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{m.alumno?.ci ?? '—'}</TableCell>
                                    <TableCell className="text-sm">
                                      {m.activa ? (
                                        <Badge variant="secondary">Activa</Badge>
                                      ) : m.motivoRetiro ? (
                                        <Badge variant="outline">Retirada{m.fechaRetiro ? ` (${m.fechaRetiro})` : ''}</Badge>
                                      ) : (
                                        <Badge variant="outline">Inactiva (promovida)</Badge>
                                      )}
                                    </TableCell>
                                    {canGestionar && (
                                      <TableCell className="text-right">
                                        {m.activa && (
                                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRetirando(m)}>
                                            <UserMinus className="mr-1 h-3.5 w-3.5" /> Retirar
                                          </Button>
                                        )}
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RetirarMatriculaModal
        open={!!retirando}
        onOpenChange={(v) => { if (!v) setRetirando(null) }}
        onConfirm={handleRetirar}
        alumnoNombre={retirando?.alumno?.nombreCompleto}
      />
      <AsistenteCierrePeriodoModal
        open={cerrandoPeriodo}
        onOpenChange={setCerrandoPeriodo}
        onDone={fetchData}
      />
    </div>
  )
}
