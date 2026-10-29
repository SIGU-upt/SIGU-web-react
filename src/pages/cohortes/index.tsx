import { Fragment, useState, useCallback, useEffect, useMemo } from "react"
import { GraduationCap, ChevronDown, ChevronRight, UserMinus, CalendarClock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/ui/page-header"
import { RetirarCohorteModal } from "@/components/forms/retirar-cohorte-modal"
import { AsistenteCierrePeriodoModal } from "@/components/forms/asistente-cierre-periodo-modal"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type AlumnoCohorte } from "@/types"
import api from "@/config/api"
import { toast } from "sonner"

// 28/10/2026: esta pantalla mostraba "cohortes" como grupos con nombre y
// cupo propios (entidad `Cohorte`, aparte de la matrícula). Se quitó esa
// capa — no era una necesidad real de la universidad y hacía el modelo
// difícil de explicar — así que ahora agrupa las matrículas reales
// (sede-PNF × trayecto × período) solo para mostrarlas, sin nombre ni cupo.
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

export function CohortesPage() {
  const { user } = useAuth()
  const [matriculas, setMatriculas] = useState<AlumnoCohorte[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [retirando, setRetirando] = useState<AlumnoCohorte | null>(null)
  const [cerrandoPeriodo, setCerrandoPeriodo] = useState(false)

  const canGestionar = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/matriculas', { params: { limit: 500 } })
      const list = res.data.data ?? res.data
      setMatriculas(Array.isArray(list) ? list : [])
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

  const handleRetirar = async (retiroData: { motivo: string; fecha?: string }) => {
    if (!retirando) return
    await api.patch(`/matriculas/${retirando.id}/retirar`, retiroData)
    toast.success('Alumno retirado')
    await fetchData()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohortes"
        subtitle="Matrículas agrupadas por sede-PNF, trayecto y período"
        icon={<GraduationCap className="h-5 w-5" />}
        actions={canGestionar ? (
          <Button variant="outline" onClick={() => setCerrandoPeriodo(true)}>
            <CalendarClock className="mr-2 h-4 w-4" />
            Cierre de Período
          </Button>
        ) : undefined}
      />
      <Card className="shadow-md">
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-8" />
                  <TableHead className="font-semibold">Sede / PNF</TableHead>
                  <TableHead className="font-semibold">Trayecto</TableHead>
                  <TableHead className="font-semibold">Período</TableHead>
                  <TableHead className="font-semibold">Alumnos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay matrículas registradas todavía.
                    </TableCell>
                  </TableRow>
                )}
                {grupos.map((g) => (
                  <Fragment key={g.clave}>
                    <TableRow className="cursor-pointer" onClick={() => setExpandedKey(expandedKey === g.clave ? null : g.clave)}>
                      <TableCell>
                        {expandedKey === g.clave ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="font-medium">{g.sedeNombre} · {g.pnfNombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{g.trayectoNombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{g.periodoNombre}</TableCell>
                      <TableCell className="text-sm">{g.miembros.filter((m) => m.activa).length} activos / {g.miembros.length} totales</TableCell>
                    </TableRow>
                    {expandedKey === g.clave && (
                      <TableRow key={`${g.clave}-detalle`}>
                        <TableCell colSpan={5} className="bg-muted/20 p-0">
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
                                    <TableCell className="text-sm">{m.alumno?.nombreCompleto ?? m.alumnoId}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RetirarCohorteModal
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
