import { useEffect, useState } from "react"
import { CalendarDays, Download, QrCode, TriangleAlert } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { WeeklyScheduleGrid, type ScheduleGridEntry } from "@/components/schedule/weekly-schedule-grid"
import { QrAsistenciaModal } from "@/components/attendance/qr-asistencia-modal"
import api from "@/config/api"
import { downloadExportedFile } from "@/lib/export"
import { hoyLocal } from "@/lib/fecha"
import type { Clase } from "@/types"

const DIA_LABEL: Record<string, string> = {
  LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
}

// GET /clases/mi-horario ya existe y ya la usa la app Flutter — devuelve las
// clases del docente agrupadas por día; se aplana para la grilla semanal
// (mismo componente que ya se usa en /secciones/:id).
export function MisClasesPage() {
  const [clases, setClases] = useState<Clase[]>([])
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [abriendoQr, setAbriendoQr] = useState<Clase | null>(null)

  useEffect(() => {
    api.get<Record<string, Clase[]>>('/clases/mi-horario')
      .then((res) => setClases(Object.values(res.data ?? {}).flat()))
      .catch(() => setClases([]))
      .finally(() => setLoading(false))
  }, [])

  // Lo que no tiene día/hora no puede dibujarse en una grilla semanal — pero
  // queda fuera sin ningún aviso, así que se cuenta aparte para avisar arriba.
  const sinHorario = clases.filter((c) => !c.diaSemana || !c.horaInicio || !c.horaFin)

  const entries: ScheduleGridEntry[] = clases
    .filter((c) => c.diaSemana && c.horaInicio && c.horaFin)
    .map((c) => ({
      id: c.id,
      diaSemana: c.diaSemana!,
      horaInicio: c.horaInicio!,
      horaFin: c.horaFin!,
      materia: c.unidadCurricular?.nombre ?? '(sin materia)',
      grupo: c.nombreGrupo,
      aula: c.aula,
    }))

  const exportar = async () => {
    setExportando(true)
    try {
      await downloadExportedFile('/export/horario', undefined, `mi_horario_${hoyLocal()}.xlsx`)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Clases"
        subtitle="Su horario semanal y el acceso a la asistencia por QR de cada clase"
        icon={<CalendarDays className="h-5 w-5" />}
      />

      <Card className="shadow-md">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Horario semanal</CardTitle>
          <Button variant="outline" size="sm" onClick={exportar} disabled={exportando}>
            <Download className="mr-2 h-4 w-4" />
            {exportando ? 'Exportando...' : 'Exportar a Excel'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {!loading && sinHorario.length > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {sinHorario.length === 1 ? 'Tiene una clase' : `Tiene ${sinHorario.length} clases`} sin día/hora asignados — no aparece{sinHorario.length === 1 ? '' : 'n'} en esta grilla. Vea la lista de abajo.
              </span>
            </div>
          )}
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <WeeklyScheduleGrid entries={entries} />
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Lista de clases</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Cargando...</p>
          ) : clases.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No tiene clases asignadas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Materia</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Sección</TableHead>
                  <TableHead>Día</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead className="text-right">Asistencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clases.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.unidadCurricular?.nombre ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{c.nombreGrupo}</TableCell>
                    <TableCell className="text-muted-foreground">{c.seccion?.codigo ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{c.diaSemana ? DIA_LABEL[c.diaSemana] ?? c.diaSemana : '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.horaInicio && c.horaFin ? (
                        `${c.horaInicio.slice(0, 5)}–${c.horaFin.slice(0, 5)}`
                      ) : (
                        <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400">Sin horario</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setAbriendoQr(c)}>
                        <QrCode className="mr-2 h-4 w-4" /> Abrir QR
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {abriendoQr && (
        <QrAsistenciaModal
          open={!!abriendoQr}
          onOpenChange={(v) => { if (!v) setAbriendoQr(null) }}
          claseId={abriendoQr.id}
          nombreClase={`${abriendoQr.unidadCurricular?.nombre ?? ''} (${abriendoQr.nombreGrupo})`}
        />
      )}
    </div>
  )
}
