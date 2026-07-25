import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { FileBarChart, Search, UserSearch, Download, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/ui/page-header"
import { type Trayecto, type Clase, type User, type SedePnf } from "@/types"
import api from "@/config/api"

async function downloadExportedFile(url: string, params: Record<string, string> | undefined, filename: string) {
  const res = await api.get(url, { params, responseType: 'blob' })
  const blobUrl = URL.createObjectURL(res.data)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  link.click()
  URL.revokeObjectURL(blobUrl)
}

export function ReportesPage() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || "clase")
  const [claseTrayectoId, setClaseTrayectoId] = useState("")
  const [claseOptions, setClaseOptions] = useState<Clase[]>([])
  const [classId, setClassId] = useState("")
  const [alumnoOptions, setAlumnoOptions] = useState<User[]>([])
  const [alumnoSearch, setAlumnoSearch] = useState("")
  const [debouncedAlumnoSearch, setDebouncedAlumnoSearch] = useState("")
  const [alumnoId, setAlumnoId] = useState(searchParams.get('alumnoId') || "")
  const hoy = new Date().toISOString().split('T')[0]
  const [fecha, setFecha] = useState(hoy)
  const [classReport, setClassReport] = useState<any>(null)
  const [alumnoReport, setAlumnoReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trayectoOptions, setTrayectoOptions] = useState<Trayecto[]>([])
  const [trayectoId, setTrayectoId] = useState("")
  const [trayectoReport, setTrayectoReport] = useState<any[] | null>(null)
  const [sedePnfOptions, setSedePnfOptions] = useState<SedePnf[]>([])
  const [sedeReportFilter, setSedeReportFilter] = useState("")
  const [sedePnfReportFilter, setSedePnfReportFilter] = useState("") // sedePnfId

  useEffect(() => {
    api.get('/trayectos').then((res) => {
      const list = res.data.data ?? res.data
      setTrayectoOptions(Array.isArray(list) ? list : [])
    }).catch(() => setTrayectoOptions([]))
    api.get('/sede-pnf').then((res) => {
      const list = res.data.data ?? res.data
      setSedePnfOptions(Array.isArray(list) ? list : [])
    }).catch(() => setSedePnfOptions([]))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAlumnoSearch(alumnoSearch), 300)
    return () => clearTimeout(timer)
  }, [alumnoSearch])

  useEffect(() => {
    api.get('/users', { params: { role: 'ALUMNO', limit: 20, ...(debouncedAlumnoSearch ? { q: debouncedAlumnoSearch } : {}) } }).then((res) => {
      const list = res.data.data ?? res.data
      setAlumnoOptions(Array.isArray(list) ? list : [])
    }).catch(() => setAlumnoOptions([]))
  }, [debouncedAlumnoSearch])

  // Cascada sede → PNF → trayecto para el reporte por trayecto, de modo que el
  // superadmin pueda acotar por sede/PNF (antes agregaba todas las sedes del PNF).
  const reportSedeOptions = Array.from(
    new Map(sedePnfOptions.map((sp) => [sp.sedeId, sp.sede?.nombre ?? sp.sedeId])).entries(),
  ).map(([id, label]) => ({ id, label }))
  const reportPnfOptions = sedePnfOptions
    .filter((sp) => !sedeReportFilter || sp.sedeId === sedeReportFilter)
    .map((sp) => ({ id: sp.id, label: sp.pnf?.nombre ?? sp.id }))
  const reportSelectedPnfId = sedePnfOptions.find((sp) => sp.id === sedePnfReportFilter)?.pnfId
  const reportTrayectoOptions = reportSelectedPnfId
    ? trayectoOptions.filter((t) => t.pnfId === reportSelectedPnfId)
    : trayectoOptions

  const [claseOptionsLoading, setClaseOptionsLoading] = useState(false)

  useEffect(() => {
    setClassId("")
    setClaseOptions([])
    if (!claseTrayectoId) return
    setClaseOptionsLoading(true)
    api.get('/clases', { params: { trayectoId: claseTrayectoId } }).then((res) => {
      const list = res.data.data ?? res.data
      setClaseOptions(Array.isArray(list) ? list : [])
    }).catch(() => setClaseOptions([]))
      .finally(() => setClaseOptionsLoading(false))
  }, [claseTrayectoId])

  const fetchTrayectoReport = async () => {
    if (!trayectoId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/reports/trayecto/${trayectoId}`, {
        params: sedePnfReportFilter ? { sedePnfId: sedePnfReportFilter } : undefined,
      })
      setTrayectoReport(res.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const exportTrayectoReport = async () => {
    if (!trayectoReport?.length || !trayectoId) return
    try {
      await downloadExportedFile(
        `/export/trayecto/${trayectoId}`,
        sedePnfReportFilter ? { sedePnfId: sedePnfReportFilter } : undefined,
        `asistencia-trayecto.xlsx`,
      )
    } catch { /* el interceptor de axios ya muestra el toast de error */ }
  }

  const fetchClassReport = async () => {
    if (!classId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/reports/clase/${classId}`, { params: { fecha } })
      setClassReport(res.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }

  const fetchAlumnoReport = async () => {
    if (!alumnoId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/reports/alumno/${alumnoId}`)
      setAlumnoReport(res.data)
      // Si se llegó por un enlace directo (?alumnoId=), puede que el alumno no esté
      // entre los primeros resultados de la búsqueda; se agrega para que el Select lo muestre.
      setAlumnoOptions((prev) => prev.some((a) => a.id === alumnoId)
        ? prev
        : [{ id: alumnoId, nombreCompleto: res.data.nombreCompleto, ci: res.data.ci } as User, ...prev])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchParams.get('alumnoId')) {
      fetchAlumnoReport()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exportClassReport = async () => {
    if (!classReport?.alumnos?.length || !classId) return
    try {
      await downloadExportedFile(`/export/clase/${classId}`, { fecha }, `asistencia-clase-${classReport.fecha}.xlsx`)
    } catch { /* el interceptor de axios ya muestra el toast de error */ }
  }

  const exportAlumnoReport = async () => {
    if (!alumnoReport?.clases?.length || !alumnoId) return
    try {
      await downloadExportedFile(`/export/alumno/${alumnoId}`, undefined, `historial_${alumnoReport.ci}.xlsx`)
    } catch { /* el interceptor de axios ya muestra el toast de error */ }
  }

  const estadoColor = (e: string) => {
    if (e === 'PRESENTE' || e === 'JUSTIFICADO') return 'bg-success'
    if (e === 'AUSENTE') return 'bg-destructive'
    return 'bg-secondary'
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" subtitle="Reportes de asistencia académica" icon={<FileBarChart className="h-5 w-5" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="clase">Por Clase</TabsTrigger>
          <TabsTrigger value="alumno">Por Alumno</TabsTrigger>
          <TabsTrigger value="trayecto">Por Trayecto</TabsTrigger>
        </TabsList>
        <TabsContent value="clase" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Reporte de Asistencia por Clase</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Select value={claseTrayectoId} onValueChange={setClaseTrayectoId}>
                  <SelectTrigger className="max-w-xs"><SelectValue placeholder="Seleccione un trayecto" /></SelectTrigger>
                  <SelectContent>
                    {trayectoOptions.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={classId} onValueChange={setClassId} disabled={!claseTrayectoId}>
                  <SelectTrigger className="max-w-xs"><SelectValue placeholder="Seleccione una clase" /></SelectTrigger>
                  <SelectContent>
                    {claseOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.unidadCurricular?.nombre ?? 'Materia'} ({c.nombreGrupo})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={fecha} max={hoy} onChange={(e) => setFecha(e.target.value)} className="max-w-[180px]" />
                <Button onClick={fetchClassReport} disabled={loading || !classId}>
                  <Search className="mr-2 h-4 w-4" />Consultar
                </Button>
                {classReport?.alumnos?.length > 0 && (
                  <Button variant="outline" onClick={exportClassReport}>
                    <Download className="mr-2 h-4 w-4" />Descargar Excel
                  </Button>
                )}
              </div>
              {claseTrayectoId && !claseOptionsLoading && claseOptions.length === 0 && (
                <p className="text-sm text-muted-foreground">Este trayecto no tiene clases registradas.</p>
              )}
              {error && <div className="text-sm text-destructive">{error}</div>}
              {classReport && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span><strong>UC:</strong> {classReport.nombreUc}</span>
                    <span><strong>Docente:</strong> {classReport.nombreDocente}</span>
                    <span><strong>Grupo:</strong> {classReport.nombreGrupo}</span>
                    <span><strong>Fecha:</strong> {classReport.fecha}</span>
                  </div>
                  {classReport.alumnos?.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Clase suspendida o sin alumnos en esta fecha.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Alumno</TableHead>
                          <TableHead>CI</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classReport.alumnos?.map((a: any) => (
                          <TableRow key={a.alumnoId}>
                            <TableCell>{a.nombreCompleto}</TableCell>
                            <TableCell className="text-muted-foreground">{a.ci}</TableCell>
                            <TableCell><Badge className={estadoColor(a.estado)}>{a.estado}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="alumno" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Reporte de Asistencia por Alumno</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar alumno por nombre o cédula..." value={alumnoSearch} onChange={(e) => setAlumnoSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={alumnoId} onValueChange={setAlumnoId}>
                  <SelectTrigger className="max-w-xs"><SelectValue placeholder="Seleccione un alumno" /></SelectTrigger>
                  <SelectContent>
                    {alumnoOptions.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nombreCompleto} ({a.ci})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={fetchAlumnoReport} disabled={loading || !alumnoId}>
                  <UserSearch className="mr-2 h-4 w-4" />Consultar
                </Button>
                {alumnoReport?.clases?.length > 0 && (
                  <Button variant="outline" onClick={exportAlumnoReport}>
                    <Download className="mr-2 h-4 w-4" />Descargar Excel
                  </Button>
                )}
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
              {alumnoReport && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-lg">
                    <span><strong>Alumno:</strong> {alumnoReport.nombreCompleto}</span>
                    <span><strong>CI:</strong> {alumnoReport.ci}</span>
                    <span className={alumnoReport.porcentajeGlobal >= (alumnoReport.umbral ?? 75) ? 'text-success font-bold' : 'text-destructive font-bold'}>
                      {alumnoReport.porcentajeGlobal}%
                    </span>
                    <span className="text-muted-foreground text-sm">Umbral: {alumnoReport.umbral ?? 75}%</span>
                    {alumnoReport.totalMaterias != null && (
                      <span className="text-muted-foreground text-sm">Materias: {alumnoReport.totalMaterias}</span>
                    )}
                    {alumnoReport.totalSesiones != null && (
                      <span className="text-muted-foreground text-sm">Sesiones totales: {alumnoReport.totalSesiones}</span>
                    )}
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div className={`h-3 rounded-full transition-all ${alumnoReport.porEncimaUmbral ? 'bg-success' : 'bg-destructive'}`} style={{ width: `${Math.min(100, alumnoReport.porcentajeGlobal)}%` }} />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>UC</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Asistencias / Sesiones</TableHead>
                        <TableHead>%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alumnoReport.clases?.map((c: any) => (
                        <TableRow key={c.claseId}>
                          <TableCell>{c.nombreUc}</TableCell>
                          <TableCell>{c.nombreGrupo}</TableCell>
                          <TableCell>
                            {c.asistencias}/{c.totalSesiones ?? c.totalClases}
                            {c.sesionesInferidas && (
                              <span className="ml-1 text-muted-foreground" title="Estimado a partir de las fechas con asistencia registrada">*</span>
                            )}
                          </TableCell>
                          <TableCell className={c.porcentaje >= (alumnoReport.umbral ?? 75) ? 'text-success font-bold' : 'text-destructive font-bold'}>
                            {c.porcentaje}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {alumnoReport.clases?.some((c: any) => c.sesionesInferidas) && (
                    <p className="text-xs text-muted-foreground">* Sesiones esperadas estimadas a partir de las fechas con asistencia registrada.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="trayecto" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Reporte de Asistencia por Trayecto</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Select value={sedeReportFilter} onValueChange={(v) => { setSedeReportFilter(v); setSedePnfReportFilter(""); setTrayectoId("") }}>
                  <SelectTrigger className="max-w-xs"><SelectValue placeholder="Seleccione una sede" /></SelectTrigger>
                  <SelectContent>
                    {reportSedeOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sedePnfReportFilter} onValueChange={(v) => { setSedePnfReportFilter(v); setTrayectoId("") }} disabled={!sedeReportFilter}>
                  <SelectTrigger className="max-w-xs"><SelectValue placeholder={sedeReportFilter ? "Seleccione un PNF" : "Elija primero una sede"} /></SelectTrigger>
                  <SelectContent>
                    {reportPnfOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={trayectoId} onValueChange={setTrayectoId} disabled={!sedePnfReportFilter}>
                  <SelectTrigger className="max-w-xs"><SelectValue placeholder={sedePnfReportFilter ? "Seleccione un trayecto" : "Elija primero un PNF"} /></SelectTrigger>
                  <SelectContent>
                    {reportTrayectoOptions.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={fetchTrayectoReport} disabled={loading || !trayectoId}>
                  <Users className="mr-2 h-4 w-4" />Consultar
                </Button>
                {trayectoReport && trayectoReport.length > 0 && (
                  <Button variant="outline" onClick={exportTrayectoReport}>
                    <Download className="mr-2 h-4 w-4" />Descargar Excel
                  </Button>
                )}
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
              {trayectoReport && (
                trayectoReport.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No hay alumnos con cohorte activa en este trayecto.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alumno</TableHead>
                        <TableHead>CI</TableHead>
                        <TableHead>%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trayectoReport.map((a: any) => (
                        <TableRow key={a.alumnoId}>
                          <TableCell>{a.nombreCompleto}</TableCell>
                          <TableCell className="text-muted-foreground">{a.ci}</TableCell>
                          <TableCell className={a.porEncimaUmbral ? 'text-success font-bold' : 'text-destructive font-bold'}>
                            {a.porcentajeGlobal}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
