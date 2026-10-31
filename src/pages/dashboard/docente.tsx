import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { LayoutDashboard, Users, CalendarClock, TriangleAlert, FileCheck2, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { AttendanceTable } from "@/components/dashboard/attendance-table"
import { GraficosDocente, type DiaConClases } from "@/components/dashboard/graficos-dashboard"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/config/api"
import type { Clase } from "@/types"

// Respuesta de GET /dashboard para DOCENTE: solo lo propio, sin cifras institucionales.
interface DashboardDocenteData {
  alumnosInscritos: number
  clasesHoy: number
  alumnosEnRiesgo: number
  inasistenciasPorJustificar: number
}

// GET /clases/mi-horario devuelve las clases del docente agrupadas por día de la semana.
type Horario = Record<string, Clase[]>

const DIAS: { clave: string; etiqueta: string }[] = [
  { clave: "LUNES", etiqueta: "Lunes" },
  { clave: "MARTES", etiqueta: "Martes" },
  { clave: "MIERCOLES", etiqueta: "Miércoles" },
  { clave: "JUEVES", etiqueta: "Jueves" },
  { clave: "VIERNES", etiqueta: "Viernes" },
  { clave: "SABADO", etiqueta: "Sábado" },
  { clave: "DOMINGO", etiqueta: "Domingo" },
]

// Día de hoy con la hora de Venezuela, en la misma clave que usa el API ("MIERCOLES").
function claveDeHoy() {
  const dia = new Intl.DateTimeFormat("es", { weekday: "long", timeZone: "America/Caracas" }).format(new Date())
  return dia.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase()
}

const hora = (h: string | null) => (h ? h.slice(0, 5) : "—")

export function DashboardDocente() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardDocenteData | null>(null)
  const [horario, setHorario] = useState<Horario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([api.get("/dashboard"), api.get("/clases/mi-horario")]).then(([dash, hor]) => {
      setStats(dash.status === "fulfilled" ? dash.value.data : null)
      setHorario(hor.status === "fulfilled" ? hor.value.data : null)
      setLoading(false)
    })
  }, [])

  const hoy = claveDeHoy()
  const diasConClases = DIAS.filter((d) => (horario?.[d.clave]?.length ?? 0) > 0)
  const totalClases = diasConClases.reduce((n, d) => n + (horario?.[d.clave]?.length ?? 0), 0)
  // Para el gráfico: de lunes a viernes siempre (aunque un día esté vacío); sábado y domingo solo si hay clases.
  const clasesPorDia: DiaConClases[] = DIAS
    .filter((d) => !["SABADO", "DOMINGO"].includes(d.clave) || (horario?.[d.clave]?.length ?? 0) > 0)
    .map((d) => ({ dia: d.etiqueta, clases: horario?.[d.clave]?.length ?? 0, hoy: d.clave === hoy }))

  const tarjetas = [
    {
      titulo: "Alumnos inscritos",
      valor: stats?.alumnosInscritos,
      detalle: "En todas sus clases",
      icono: Users,
      alerta: false,
    },
    {
      titulo: "Clases hoy",
      valor: stats?.clasesHoy,
      detalle: "Sin contar las suspendidas",
      icono: CalendarClock,
      alerta: false,
    },
    {
      titulo: "Alumnos en riesgo",
      valor: stats?.alumnosEnRiesgo,
      detalle: "Por debajo del umbral de asistencia",
      icono: TriangleAlert,
      alerta: (stats?.alumnosEnRiesgo ?? 0) > 0,
    },
  ]
  const porJustificar = stats?.inasistenciasPorJustificar

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de Control"
        subtitle={user ? `Bienvenido, ${user.nombres} ${user.apellidos} (Docente)` : "Cargando..."}
        icon={<LayoutDashboard className="h-6 w-6" />}
      />

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Cargando su resumen...</div>
      ) : stats === null ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No se pudo cargar su resumen. Intente recargar la página.</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {tarjetas.map((t) => (
            <Card key={t.titulo}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{t.titulo}</p>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${t.alerta ? "bg-destructive" : "bg-primary"}`}>
                    <t.icono className={`h-5 w-5 ${t.alerta ? "text-destructive-foreground" : "text-primary-foreground"}`} />
                  </div>
                </div>
                <p className="mt-4 text-4xl font-bold tabular-nums">{t.valor ?? "—"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.detalle}</p>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="flex h-full flex-col p-6">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-muted-foreground">Inasistencias por justificar</p>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${(porJustificar ?? 0) > 0 ? "bg-destructive" : "bg-primary"}`}>
                  <FileCheck2 className={`h-5 w-5 ${(porJustificar ?? 0) > 0 ? "text-destructive-foreground" : "text-primary-foreground"}`} />
                </div>
              </div>
              <p className="mt-4 text-4xl font-bold tabular-nums">{porJustificar ?? "—"}</p>
              <p className="mt-1 text-xs text-muted-foreground">De los últimos 7 días, que es lo que admite el sistema</p>
              <Link to="/reportes" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Ir a Reportes <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground">Mi horario de la semana</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-6">Cargando horario...</div>
          ) : horario === null ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No se pudo cargar su horario.</p>
          ) : totalClases === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Todavía no tiene clases asignadas.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {diasConClases.map((d) => (
                <div key={d.clave} className={`rounded-lg border p-4 ${d.clave === hoy ? "border-primary" : "border-border"}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{d.etiqueta}</h3>
                    {d.clave === hoy && <Badge>Hoy</Badge>}
                  </div>
                  <ul className="space-y-2">
                    {[...(horario[d.clave] ?? [])]
                      .sort((a, b) => (a.horaInicio ?? "").localeCompare(b.horaInicio ?? ""))
                      .map((c) => (
                        <li key={c.id} className="text-sm">
                          <p className="font-medium text-foreground">
                            {c.unidadCurricular?.catalogo?.nombre ?? c.unidadCurricular?.nombre ?? "Materia"} ({c.nombreGrupo})
                          </p>
                          <p className="text-muted-foreground tabular-nums">
                            {hora(c.horaInicio)} – {hora(c.horaFin)}
                            {c.aula ? ` · ${c.aula}` : ""}
                          </p>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {horario !== null && <GraficosDocente dias={clasesPorDia} />}

      <AttendanceTable />
    </div>
  )
}
