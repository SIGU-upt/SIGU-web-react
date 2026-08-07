import { useState, useCallback, useEffect } from "react"
import { CalendarOff } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { PageHeader } from "@/components/ui/page-header"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type ClaseSuspendida, type User, type Seccion } from "@/types"
import api from "@/config/api"

export function ClasesSuspendidasPage() {
  const { user } = useAuth()
  const [data, setData] = useState<ClaseSuspendida[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [seccionId, setSeccionId] = useState("")
  const [docenteId, setDocenteId] = useState("")
  const [page, setPage] = useState(1)
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [docentes, setDocentes] = useState<User[]>([])
  const [anulando, setAnulando] = useState<ClaseSuspendida | null>(null)

  // La jurisdicción ya la aplica el backend (coordinador → su sede-PNF, rector
  // → su sede): estos selects de filtro se llenan con /secciones y
  // /users?role=DOCENTE, que ya devuelven solo lo que le corresponde a quien
  // consulta, sin necesidad de repetir el alcance aquí.
  const canAnular = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false

  useEffect(() => {
    api.get('/secciones').then((res) => setSecciones(res.data.data ?? res.data)).catch(() => setSecciones([]))
    api.get('/users', { params: { role: 'DOCENTE', limit: 200 } }).then((res) => setDocentes(res.data.data ?? res.data)).catch(() => setDocentes([]))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit: 20 }
      if (fechaDesde) params.fechaDesde = fechaDesde
      if (fechaHasta) params.fechaHasta = fechaHasta
      if (seccionId) params.seccionId = seccionId
      if (docenteId) params.docenteId = docenteId
      const res = await api.get('/clases-suspendidas', { params })
      setData(Array.isArray(res.data.data) ? res.data.data : [])
      setMeta(res.data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 0 })
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [page, fechaDesde, fechaHasta, seccionId, docenteId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAnular = async () => {
    if (!anulando) return
    await api.delete(`/clases-suspendidas/${anulando.id}`)
    await fetchData()
  }

  const hayFiltros = !!(fechaDesde || fechaHasta || seccionId || docenteId)
  const limpiarFiltros = () => {
    setFechaDesde(""); setFechaHasta(""); setSeccionId(""); setDocenteId(""); setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Clases Suspendidas" subtitle="Historial de suspensiones registradas" icon={<CalendarOff className="h-5 w-5" />} />
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPage(1) }} className="max-w-[160px]" />
            <span className="text-sm text-muted-foreground">a</span>
            <Input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setPage(1) }} className="max-w-[160px]" />
            <Select value={seccionId || "__all__"} onValueChange={(v) => { setSeccionId(v === "__all__" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Sección" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las secciones</SelectItem>
                {secciones.map((s) => <SelectItem key={s.id} value={s.id}>{s.codigo}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={docenteId || "__all__"} onValueChange={(v) => { setDocenteId(v === "__all__" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Docente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los docentes</SelectItem>
                {docentes.map((d) => <SelectItem key={d.id} value={d.id}>{d.nombreCompleto}</SelectItem>)}
              </SelectContent>
            </Select>
            {hayFiltros && (
              <Button variant="ghost" size="sm" onClick={limpiarFiltros}>Limpiar</Button>
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
                    <TableHead className="font-semibold">Fecha</TableHead>
                    <TableHead className="font-semibold">Materia</TableHead>
                    <TableHead className="font-semibold">Sección</TableHead>
                    <TableHead className="font-semibold">Docente</TableHead>
                    <TableHead className="font-semibold">Motivo</TableHead>
                    {canAnular && <TableHead className="font-semibold text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={canAnular ? 6 : 5} className="text-center py-8 text-muted-foreground">
                        No se encontraron suspensiones.
                      </TableCell>
                    </TableRow>
                  )}
                  {data.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm text-muted-foreground">{s.fecha}</TableCell>
                      <TableCell className="text-sm">
                        {s.clase?.unidadCurricular?.nombre ?? '—'}
                        {s.clase?.nombreGrupo && <Badge variant="secondary" className="ml-2 font-mono">{s.clase.nombreGrupo}</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.clase?.seccion?.codigo ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.clase?.docente?.nombreCompleto ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.motivo}</TableCell>
                      {canAnular && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setAnulando(s)}>Anular</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={meta.page}
                totalPages={meta.totalPages}
                totalItems={meta.total}
                startIndex={(meta.page - 1) * meta.limit}
                endIndex={(meta.page - 1) * meta.limit + data.length}
                onPageChange={setPage}
                label="suspensiones"
              />
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteModal
        open={!!anulando}
        onOpenChange={(v) => { if (!v) setAnulando(null) }}
        onConfirm={handleAnular}
        title="Anular suspensión"
        description={`¿Anular la suspensión del ${anulando?.fecha}${anulando?.clase?.unidadCurricular?.nombre ? ` de ${anulando.clase.unidadCurricular.nombre}` : ''}? Esta acción no se puede deshacer.`}
        confirmLabel="Anular"
        loadingLabel="Anulando..."
      />
    </div>
  )
}
