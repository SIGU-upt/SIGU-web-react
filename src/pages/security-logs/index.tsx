import { useState, useCallback, useEffect } from "react"
import { Shield, Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/ui/page-header"
import { type SecurityLog } from "@/types"
import api from "@/config/api"
import { hoyLocal } from "@/lib/fecha"
import { ListSkeleton } from "@/components/ui/table-skeleton"

// Lista completa de valores reales de `accion` que el backend llega a
// escribir (ver los `securityLogsService.log(...)` en auth, users,
// attendance, clases y backup) — antes faltaban varios y el filtro no
// dejaba acotar por ellos.
const ACCIONES = [
  'LOGIN_EXITOSO',
  'LOGIN_CLIENTE_INVALIDO',
  'LOGIN_DISPOSITIVO_INVALIDO',
  'LOGIN_FALLIDO',
  'DEVICE_BOUND',
  'DEVICE_RESET',
  'PASSWORD_RESET',
  'PASSWORD_RESET_ADMIN',
  'PASSWORD_CHANGED',
  'CAMBIO_ROL',
  'BORRADO_FORZADO',
  'EXPORT_DATOS',
  'REGISTRO_ASISTENCIA',
  'JUSTIFICAR_ASISTENCIA',
  'ASISTENCIA_UBICACION_DISTINTA',
  'CLASE_SUSPENDIDA',
  'SUSPENSION_ANULADA',
  'RESTORE_PASSWORD_INCORRECTA',
  'DB_RESTORED',
  'ACCESO_NO_AUTORIZADO',
  'ERROR_INTERNO',
]

export function SecurityLogsPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [acciones, setAcciones] = useState<string[]>([])
  // Por defecto solo el día de hoy: esta tabla puede crecer enorme (un
  // registro por cada intento de login, escaneo de QR, etc.) y "todo el
  // historial" como vista inicial no es útil ni liviano. El usuario amplía
  // el rango a mano cuando lo necesite; la paginación del servidor es lo
  // que de verdad acota el costo, no el rango de fechas.
  const [fechaDesde, setFechaDesde] = useState(hoyLocal())
  const [fechaHasta, setFechaHasta] = useState(hoyLocal())
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params: Record<string, string | string[]> = { page: String(page), limit: '20' }
      if (acciones.length) params.accion = acciones
      if (fechaDesde) params.fechaDesde = fechaDesde
      if (fechaHasta) params.fechaHasta = fechaHasta
      if (q.trim()) params.q = q.trim()
      const res = await api.get('/security-logs', { params })
      setLogs(res.data.data ?? [])
      setTotalPages(res.data.meta?.totalPages ?? 1)
    } catch { setLogs([]) }
    finally { setLoading(false) }
  }, [acciones, fechaDesde, fechaHasta, page])

  // La búsqueda va al servidor y se debounce para no golpear la API en cada tecla.
  useEffect(() => {
    const timeout = setTimeout(() => fetchData(search), 300)
    return () => clearTimeout(timeout)
  }, [fetchData, search])

  // Volver a la página 1 cada vez que cambia un filtro, no la paginación en sí.
  useEffect(() => { setPage(1) }, [acciones, fechaDesde, fechaHasta, search])

  const toggleAccion = (a: string) => {
    setAcciones((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }

  const hayFiltrosNoPorDefecto =
    acciones.length > 0 || fechaDesde !== hoyLocal() || fechaHasta !== hoyLocal() || search.trim() !== ""

  const limpiar = () => {
    setAcciones([])
    setFechaDesde(hoyLocal())
    setFechaHasta(hoyLocal())
    setSearch("")
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Logs de Seguridad" subtitle="Auditoría de eventos de seguridad del sistema" icon={<Shield className="h-5 w-5" />} />
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div data-tour="security-logs-filtros" className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por usuario o detalle..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-56 justify-between font-normal">
                  <span className="truncate">
                    {acciones.length === 0 ? "Todas las acciones" : `${acciones.length} acción${acciones.length > 1 ? "es" : ""} seleccionada${acciones.length > 1 ? "s" : ""}`}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
                {ACCIONES.map((a) => (
                  <DropdownMenuCheckboxItem
                    key={a}
                    checked={acciones.includes(a)}
                    onCheckedChange={() => toggleAccion(a)}
                    onSelect={(e) => e.preventDefault()}
                    className="font-mono text-xs"
                  >
                    {a}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Input type="date" value={fechaDesde} max={hoyLocal()} onChange={(e) => setFechaDesde(e.target.value)} className="max-w-[160px]" />
            <span className="text-sm text-muted-foreground">a</span>
            <Input type="date" value={fechaHasta} max={hoyLocal()} onChange={(e) => setFechaHasta(e.target.value)} className="max-w-[160px]" />
            {hayFiltrosNoPorDefecto && (
              <Button variant="ghost" size="sm" onClick={limpiar}>Limpiar</Button>
            )}
          </div>
        </CardHeader>
        <CardContent data-tour="security-logs-tabla">
          {loading ? (
            <ListSkeleton />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-semibold">Fecha</TableHead>
                    <TableHead className="font-semibold">Usuario</TableHead>
                    <TableHead className="font-semibold">Acción</TableHead>
                    <TableHead className="font-semibold">Detalle</TableHead>
                    <TableHead className="font-semibold">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No se encontraron registros.
                      </TableCell>
                    </TableRow>
                  )}
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{log.user?.nombreCompleto ?? '—'}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-mono text-xs">{log.accion}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.detalle ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.ipAddress ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 pt-4">
                  <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
                  <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
