import { useState, useCallback, useEffect } from "react"
import { Archive, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/ui/page-header"
import api from "@/config/api"
import { hoyLocal } from "@/lib/fecha"
import { downloadExportedFile } from "@/lib/export"

const TIPOS: { value: string; label: string }[] = [
  { value: "SEDE", label: "Sedes" },
  { value: "SEDE_PNF", label: "Sede-PNF" },
  { value: "PNF", label: "PNF" },
  { value: "TRAYECTO", label: "Trayectos" },
  { value: "TRAMO", label: "Tramos" },
  { value: "UNIDAD_CURRICULAR", label: "Unidades curriculares" },
  { value: "UC_CATALOGO", label: "Catálogo de materias" },
  { value: "SECCION", label: "Secciones" },
  { value: "CLASE", label: "Clases" },
  { value: "INSCRIPCION", label: "Inscripciones" },
  { value: "ALUMNO_COHORTE", label: "Matrículas" },
  { value: "PERIODO_ACADEMICO", label: "Períodos académicos" },
  { value: "USER", label: "Usuarios" },
  { value: "CLASE_SUSPENDIDA", label: "Suspensiones de clase" },
]

interface HistorialItem {
  id: string
  tipo: string
  descripcion: string
  deletedAt: string
  deletedByNombre: string | null
}

export function HistorialPage() {
  const [tipo, setTipo] = useState("CLASE")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [items, setItems] = useState<HistorialItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { tipo, page: String(page), limit: '20' }
      if (fechaDesde) params.fechaDesde = fechaDesde
      if (fechaHasta) params.fechaHasta = fechaHasta
      const res = await api.get('/historial-eliminados', { params })
      setItems(res.data.data ?? [])
      setTotalPages(res.data.meta?.totalPages ?? 1)
    } catch { setItems([]) }
    finally { setLoading(false) }
  }, [tipo, page, fechaDesde, fechaHasta])

  useEffect(() => { fetchData() }, [fetchData])
  // Volver a la página 1 cada vez que cambian los filtros, no la paginación.
  useEffect(() => { setPage(1) }, [tipo, fechaDesde, fechaHasta])

  const exportar = async () => {
    setExportando(true)
    try {
      const params: Record<string, string> = { tipo }
      if (fechaDesde) params.fechaDesde = fechaDesde
      if (fechaHasta) params.fechaHasta = fechaHasta
      await downloadExportedFile('/historial-eliminados/export', params, `historial_${tipo.toLowerCase()}_${hoyLocal()}.xlsx`)
    } finally { setExportando(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial de eliminados"
        subtitle="Registros dados de baja (borrado lógico), por tipo de entidad"
        icon={<Archive className="h-5 w-5" />}
      />
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={fechaDesde} max={hoyLocal()} onChange={(e) => setFechaDesde(e.target.value)} className="max-w-[160px]" />
            <span className="text-sm text-muted-foreground">a</span>
            <Input type="date" value={fechaHasta} max={hoyLocal()} onChange={(e) => setFechaHasta(e.target.value)} className="max-w-[160px]" />
            {(fechaDesde || fechaHasta) && (
              <Button variant="ghost" size="sm" onClick={() => { setFechaDesde(""); setFechaHasta("") }}>Limpiar</Button>
            )}
            <Button variant="outline" size="sm" className="ml-auto" onClick={exportar} disabled={exportando}>
              <Download className="h-4 w-4" />
              {exportando ? 'Exportando...' : 'Exportar a Excel'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Cargando...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-semibold">Descripción</TableHead>
                    <TableHead className="font-semibold">Eliminado el</TableHead>
                    <TableHead className="font-semibold">Eliminado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No hay registros eliminados de este tipo en el rango elegido.
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">{item.descripcion}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(item.deletedAt).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.deletedByNombre ?? 'Desconocido'}</TableCell>
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
