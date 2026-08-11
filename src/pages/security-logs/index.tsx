import { useState, useCallback, useEffect } from "react"
import { Shield, Search } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/ui/page-header"
import { type SecurityLog } from "@/types"
import api from "@/config/api"

const ACCIONES = [
  'LOGIN_CLIENTE_INVALIDO',
  'LOGIN_DISPOSITIVO_INVALIDO',
  'LOGIN_FALLIDO',
  'PASSWORD_RESET',
  'PASSWORD_CHANGED',
  'DEVICE_RESET',
  'REGISTRO_ASISTENCIA',
  'JUSTIFICAR_ASISTENCIA',
]

export function SecurityLogsPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [accion, setAccion] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [search, setSearch] = useState("")

  const fetchData = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params: Record<string, string> = { limit: '200' }
      if (accion) params.accion = accion
      if (fechaDesde) params.fechaDesde = fechaDesde
      if (fechaHasta) params.fechaHasta = fechaHasta
      if (q.trim()) params.q = q.trim()
      const res = await api.get('/security-logs', { params })
      const list = res.data.data ?? res.data
      setLogs(Array.isArray(list) ? list : [])
    } catch { setLogs([]) }
    finally { setLoading(false) }
  }, [accion, fechaDesde, fechaHasta])

  // La búsqueda va al servidor (antes filtraba en el navegador sobre un
  // `.take(200)` fijo: un evento fuera de esas 200 filas más recientes parecía
  // no existir aunque se buscara por su cédula exacta). Se debounce para no
  // golpear la API en cada tecla.
  useEffect(() => {
    const timeout = setTimeout(() => fetchData(search), 300)
    return () => clearTimeout(timeout)
  }, [fetchData, search])

  return (
    <div className="space-y-6">
      <PageHeader title="Logs de Seguridad" subtitle="Auditoría de eventos de seguridad del sistema" icon={<Shield className="h-5 w-5" />} />
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por usuario o detalle..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={accion || "__all__"} onValueChange={(v) => setAccion(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Acción" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las acciones</SelectItem>
                {ACCIONES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="max-w-[160px]" />
            <span className="text-sm text-muted-foreground">a</span>
            <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="max-w-[160px]" />
            {(accion || fechaDesde || fechaHasta) && (
              <Button variant="ghost" size="sm" onClick={() => { setAccion(""); setFechaDesde(""); setFechaHasta("") }}>Limpiar</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
