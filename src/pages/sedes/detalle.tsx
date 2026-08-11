import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Building, BookOpen, Users, GraduationCap, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/ui/page-header"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { type Sede, type SedePnf, type Seccion, type User } from "@/types"
import api from "@/config/api"

export function SedeDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [sede, setSede] = useState<Sede | null>(null)
  const [sedePnfs, setSedePnfs] = useState<SedePnf[]>([])
  const [secciones, setSecciones] = useState<Seccion[]>([])
  const [docentes, setDocentes] = useState<User[]>([])
  const [alumnos, setAlumnos] = useState<User[]>([])
  const [alumnosMeta, setAlumnosMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [alumnosPage, setAlumnosPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [sedeRes, sedePnfRes, seccionesRes, docentesRes, alumnosRes] = await Promise.all([
        api.get(`/sedes/${id}`),
        api.get('/sede-pnf', { params: { sedeId: id } }),
        api.get('/secciones', { params: { sedeId: id } }),
        api.get('/users', { params: { role: 'DOCENTE', sedeId: id, limit: 200 } }),
        api.get('/users', { params: { role: 'ALUMNO', sedeId: id, page: alumnosPage, limit: 20 } }),
      ])
      setSede(sedeRes.data)
      setSedePnfs(sedePnfRes.data.data ?? sedePnfRes.data ?? [])
      setSecciones(seccionesRes.data.data ?? seccionesRes.data ?? [])
      setDocentes(docentesRes.data.data ?? docentesRes.data ?? [])
      setAlumnos(alumnosRes.data.data ?? [])
      if (alumnosRes.data.meta) setAlumnosMeta(alumnosRes.data.meta)
    } catch {
      setSede(null)
    } finally {
      setLoading(false)
    }
  }, [id, alumnosPage])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Cargando...</div>
  }

  if (!sede) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/configuracion')} className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="text-center py-10 text-muted-foreground">Sede no encontrada.</div>
      </div>
    )
  }

  const seccionesPorPnf = new Map<string, Seccion[]>()
  for (const s of secciones) {
    seccionesPorPnf.set(s.sedePnfId, [...(seccionesPorPnf.get(s.sedePnfId) ?? []), s])
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/configuracion')} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Configuración
      </Button>

      <PageHeader title={sede.nombre} subtitle={sede.ubicacion} icon={<Building className="h-5 w-5" />} />

      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="h-5 w-5" /> PNF ofrecidos ({sedePnfs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sedePnfs.length === 0 ? (
            <p className="text-center py-4 text-sm text-muted-foreground">Esta sede todavía no ofrece ningún PNF.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>PNF</TableHead><TableHead>Secciones</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {sedePnfs.map((sp) => (
                  <TableRow key={sp.id}>
                    <TableCell>
                      <Link to={`/pnfs/${sp.pnfId}`} className="hover:underline flex items-center gap-2">
                        {sp.pnf?.nombre ?? sp.pnfId}
                        <Badge variant="secondary" className="font-mono">{sp.pnf?.codigo}</Badge>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{(seccionesPorPnf.get(sp.id) ?? []).length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg"><Layers className="h-5 w-5" /> Secciones ({secciones.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {secciones.length === 0 ? (
            <p className="text-center py-4 text-sm text-muted-foreground">Sin secciones en esta sede.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {secciones.map((s) => (
                <Link key={s.id} to={`/secciones/${s.id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">{s.codigo}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5" /> Docentes ({docentes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {docentes.length === 0 ? (
            <p className="text-center py-4 text-sm text-muted-foreground">Sin docentes en esta sede.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Nombre</TableHead><TableHead>Cédula</TableHead><TableHead>Email</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {docentes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.nombreCompleto}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.ci}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg"><GraduationCap className="h-5 w-5" /> Alumnos ({alumnosMeta.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {alumnos.length === 0 ? (
            <p className="text-center py-4 text-sm text-muted-foreground">Sin alumnos en esta sede.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Nombre</TableHead><TableHead>Cédula</TableHead><TableHead>Sede-PNF</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {alumnos.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.nombreCompleto}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.ci}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.sedePnf?.pnf?.nombre ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={alumnosMeta.page}
                totalPages={alumnosMeta.totalPages}
                totalItems={alumnosMeta.total}
                startIndex={(alumnosMeta.page - 1) * alumnosMeta.limit}
                endIndex={(alumnosMeta.page - 1) * alumnosMeta.limit + alumnos.length}
                onPageChange={setAlumnosPage}
                label="alumnos"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
