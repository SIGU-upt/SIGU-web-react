import { useState } from "react"
import { FileBarChart, Search, UserSearch } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/ui/page-header"
import api from "@/config/api"

export function ReportesPage() {
  const [tab, setTab] = useState("clase")
  const [classId, setClassId] = useState("")
  const [alumnoId, setAlumnoId] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [classReport, setClassReport] = useState<any>(null)
  const [alumnoReport, setAlumnoReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
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
        </TabsList>
        <TabsContent value="clase" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Reporte de Asistencia por Clase</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Input placeholder="ID de la clase" value={classId} onChange={(e) => setClassId(e.target.value)} className="max-w-xs" />
                <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="max-w-[180px]" />
                <Button onClick={fetchClassReport} disabled={loading}>
                  <Search className="mr-2 h-4 w-4" />Consultar
                </Button>
              </div>
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
                <Input placeholder="ID del alumno" value={alumnoId} onChange={(e) => setAlumnoId(e.target.value)} className="max-w-xs" />
                <Button onClick={fetchAlumnoReport} disabled={loading}>
                  <UserSearch className="mr-2 h-4 w-4" />Consultar
                </Button>
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
                  </div>
                  <div className="w-full bg-secondary rounded-full h-3">
                    <div className={`h-3 rounded-full transition-all ${alumnoReport.porEncimaUmbral ? 'bg-success' : 'bg-destructive'}`} style={{ width: `${Math.min(100, alumnoReport.porcentajeGlobal)}%` }} />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>UC</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Asistencias</TableHead>
                        <TableHead>%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alumnoReport.clases?.map((c: any) => (
                        <TableRow key={c.claseId}>
                          <TableCell>{c.nombreUc}</TableCell>
                          <TableCell>{c.nombreGrupo}</TableCell>
                          <TableCell>{c.asistencias}/{c.totalClases}</TableCell>
                          <TableCell className={c.porCentaje >= (alumnoReport.umbral ?? 75) ? 'text-success font-bold' : 'text-destructive font-bold'}>
                            {c.porcentaje}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
