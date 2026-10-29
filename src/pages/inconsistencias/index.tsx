import { useState, useEffect, useCallback, useMemo } from "react"
import { AlertTriangle, CheckCircle2, Download, RefreshCw, Search } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { PageHeader } from "@/components/ui/page-header"
import { downloadCsv } from "@/lib/export-csv"
import type { InscripcionInconsistencia, TipoInconsistencia } from "@/types"
import api from "@/config/api"

const PAGE_SIZE = 20

const TIPO_LABEL: Record<TipoInconsistencia, string> = {
  MULTIPLE_SECCION: "Varias secciones",
  MULTIPLE_GRUPO_MISMA_UC: "Varios grupos de una materia",
}

// Compara sin distinguir mayúsculas ni acentos ("Perez" encuentra "Pérez").
const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

export function InconsistenciasPage() {
  const [items, setItems] = useState<InscripcionInconsistencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")
  const [tipo, setTipo] = useState<"todos" | TipoInconsistencia>("todos")
  const [page, setPage] = useState(1)

  // El backend ya acota el resultado a la jurisdicción de quien consulta
  // (coordinador → su sede-PNF, rector → su sede) y devuelve la lista completa
  // sin paginar, así que la búsqueda y la paginación se hacen aquí.
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await api.get('/inscripciones/inconsistencias')
      const list = res.data.data ?? res.data
      setItems(Array.isArray(list) ? list : [])
    } catch {
      setItems([])
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtradas = useMemo(() => {
    const termino = normalizar(search.trim())
    return items.filter((i) =>
      (tipo === "todos" || i.tipo === tipo) &&
      (!termino || [i.nombreCompleto, i.ci, i.detalle].some((t) => normalizar(t).includes(termino))),
    )
  }, [items, search, tipo])

  const alumnosAfectados = useMemo(() => new Set(items.map((i) => i.alumnoId)).size, [items])
  const porTipo = (t: TipoInconsistencia) => items.filter((i) => i.tipo === t).length

  const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const startIndex = (page - 1) * PAGE_SIZE
  const pagina = filtradas.slice(startIndex, startIndex + PAGE_SIZE)

  const handleExport = () => {
    downloadCsv("inconsistencias-matricula.csv", filtradas.map((i) => ({
      Alumno: i.nombreCompleto,
      Cédula: i.ci,
      Tipo: TIPO_LABEL[i.tipo],
      Detalle: i.detalle,
    })))
  }

  const hayFiltros = !!search || tipo !== "todos"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inconsistencias de matrícula"
        subtitle="Alumnos que ya incumplen las reglas: inscritos en más de una sección o en más de un grupo de la misma materia"
        icon={<AlertTriangle className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={filtradas.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold tabular-nums text-foreground">{alumnosAfectados}</p>
            <p className="text-sm text-muted-foreground">Alumnos afectados</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold tabular-nums text-foreground">{porTipo("MULTIPLE_SECCION")}</p>
            <p className="text-sm text-muted-foreground">Casos: {TIPO_LABEL.MULTIPLE_SECCION.toLowerCase()}</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold tabular-nums text-foreground">{porTipo("MULTIPLE_GRUPO_MISMA_UC")}</p>
            <p className="text-sm text-muted-foreground">Casos: {TIPO_LABEL.MULTIPLE_GRUPO_MISMA_UC.toLowerCase()}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cédula o detalle..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-10"
              />
            </div>
            <Select value={tipo} onValueChange={(v) => { setTipo(v as "todos" | TipoInconsistencia); setPage(1) }}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="MULTIPLE_SECCION">{TIPO_LABEL.MULTIPLE_SECCION}</SelectItem>
                <SelectItem value="MULTIPLE_GRUPO_MISMA_UC">{TIPO_LABEL.MULTIPLE_GRUPO_MISMA_UC}</SelectItem>
              </SelectContent>
            </Select>
            {hayFiltros && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setTipo("todos"); setPage(1) }}>
                Limpiar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Cargando...</div>
          ) : error ? (
            <div className="text-center py-10 text-destructive">
              No se pudo cargar el listado. Intente actualizar.
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <p className="font-medium text-foreground">No hay inconsistencias</p>
              <p className="text-sm text-muted-foreground">Ningún alumno incumple las reglas de matrícula.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-semibold">Alumno</TableHead>
                    <TableHead className="font-semibold min-w-44">Tipo</TableHead>
                    <TableHead className="font-semibold">Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagina.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Ningún resultado coincide con los filtros.
                      </TableCell>
                    </TableRow>
                  )}
                  {pagina.map((i, idx) => (
                    <TableRow key={`${i.alumnoId}-${i.tipo}-${startIndex + idx}`} className="hover:bg-muted/70">
                      <TableCell>
                        <p className="font-medium text-foreground">{i.nombreCompleto}</p>
                        <p className="text-xs text-muted-foreground font-mono">{i.ci}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-normal text-left">{TIPO_LABEL[i.tipo]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-normal">{i.detalle}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                totalItems={filtradas.length}
                startIndex={startIndex}
                endIndex={startIndex + PAGE_SIZE}
                onPageChange={setPage}
                label="inconsistencias"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
