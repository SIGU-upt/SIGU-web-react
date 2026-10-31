import { useEffect, useState, type ReactNode } from "react"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { BarChart3, ChevronDown, PieChart as PieChartIcon, TriangleAlert } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import api from "@/config/api"
import { cn } from "@/lib/utils"

// Umbral general de asistencia (el API aplica 80 % a Práctica Profesional; aquí se dibuja la referencia general).
const UMBRAL_ASISTENCIA = 75
const REGISTROS_RECIENTES = 100
const ALUMNOS_EN_GRAFICO = 10

interface GraficosDashboardProps {
  totalUsuarios: number
  totalDocentes: number
  totalAlumnos: number
}

interface SeccionGraficoProps {
  titulo: string
  descripcion: string
  icono: ReactNode
  children: ReactNode
}

/**
 * Sección plegada por defecto: no ocupa espacio ni pide datos hasta que se despliega. El contenido
 * se monta solo al abrirla (Radix lo desmonta al cerrar), así que cada gráfico carga sus datos
 * en ese momento y no antes.
 */
function SeccionGrafico({ titulo, descripcion, icono, children }: SeccionGraficoProps) {
  const [abierto, setAbierto] = useState(false)
  return (
    <Collapsible open={abierto} onOpenChange={setAbierto} className="border-t first:border-t-0">
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-6 py-4 text-left text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          {icono}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{titulo}</span>
          <span className="block text-xs text-muted-foreground">{descripcion}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", abierto && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-6 pb-6">{children}</CollapsibleContent>
    </Collapsible>
  )
}

function Mensaje({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
}

// ---------- 1. Composición de usuarios (usa las cifras que ya trae el dashboard) ----------

const configUsuarios = {
  docentes: { label: "Docentes", color: "var(--chart-1)" },
  alumnos: { label: "Alumnos", color: "var(--chart-2)" },
  personal: { label: "Personal administrativo", color: "var(--chart-3)" },
} satisfies ChartConfig

function GraficoUsuarios({ totalUsuarios, totalDocentes, totalAlumnos }: GraficosDashboardProps) {
  const personal = Math.max(0, totalUsuarios - totalDocentes - totalAlumnos)
  const datos = [
    { grupo: "docentes", total: totalDocentes, fill: "var(--color-docentes)" },
    { grupo: "alumnos", total: totalAlumnos, fill: "var(--color-alumnos)" },
    { grupo: "personal", total: personal, fill: "var(--color-personal)" },
  ].filter((d) => d.total > 0)

  if (datos.length === 0) return <Mensaje>No hay usuarios registrados en este ámbito.</Mensaje>

  return (
    <ChartContainer
      config={configUsuarios}
      className="mx-auto aspect-auto h-64 w-full max-w-md"
      role="img"
      aria-label={`Usuarios: ${totalDocentes} docentes, ${totalAlumnos} alumnos y ${personal} de personal administrativo.`}
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="grupo" />} />
        <Pie
          data={datos}
          dataKey="total"
          nameKey="grupo"
          innerRadius={50}
          outerRadius={78}
          strokeWidth={2}
          labelLine={false}
          label={({ cx, cy, midAngle, outerRadius, value }) => {
            const rad = (Math.PI / 180) * -midAngle
            const r = outerRadius + 14
            return (
              <text x={cx + r * Math.cos(rad)} y={cy + r * Math.sin(rad)} textAnchor="middle" dominantBaseline="central" className="fill-foreground text-xs font-medium">
                {value}
              </text>
            )
          }}
        />
        <ChartLegend content={<ChartLegendContent nameKey="grupo" />} />
      </PieChart>
    </ChartContainer>
  )
}

// ---------- 2. Asistencia reciente por estado ----------

const configEstados = {
  total: { label: "Registros" },
  presente: { label: "Presente", color: "var(--chart-3)" },
  retardo: { label: "Retardo", color: "var(--chart-2)" },
  ausente: { label: "Ausente", color: "var(--chart-4)" },
  justificado: { label: "Justificado", color: "var(--chart-1)" },
} satisfies ChartConfig

type Estado = "presente" | "retardo" | "ausente" | "justificado"
const ESTADOS: Estado[] = ["presente", "retardo", "ausente", "justificado"]

function GraficoAsistencia() {
  const [conteo, setConteo] = useState<Record<Estado, number> | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let vigente = true
    api.get("/attendance", { params: { limit: REGISTROS_RECIENTES } })
      .then((res) => {
        if (!vigente) return
        const lista: { estado?: string }[] = res.data.data ?? res.data
        const nuevo: Record<Estado, number> = { presente: 0, retardo: 0, ausente: 0, justificado: 0 }
        for (const a of Array.isArray(lista) ? lista : []) {
          const clave = a.estado?.toLowerCase() as Estado
          if (clave in nuevo) nuevo[clave] += 1
        }
        setConteo(nuevo)
      })
      .catch(() => vigente && setError(true))
    return () => { vigente = false }
  }, [])

  if (error) return <Mensaje>No se pudo cargar la asistencia.</Mensaje>
  if (!conteo) return <Mensaje>Cargando gráfico…</Mensaje>

  const datos = ESTADOS.map((e) => ({ estado: e, total: conteo[e], fill: `var(--color-${e})` }))
  const suma = datos.reduce((acc, d) => acc + d.total, 0)
  if (suma === 0) return <Mensaje>Aún no hay registros de asistencia.</Mensaje>

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">Últimos {Math.min(suma, REGISTROS_RECIENTES)} registros.</p>
      <ChartContainer
        config={configEstados}
        className="aspect-auto h-64 w-full"
        role="img"
        aria-label={`Asistencia reciente: ${datos.map((d) => `${d.total} ${configEstados[d.estado].label.toLowerCase()}`).join(", ")}.`}
      >
        <BarChart data={datos} margin={{ top: 20 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="estado" tickLine={false} axisLine={false} tickFormatter={(v: Estado) => configEstados[v].label} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="estado" />} />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {datos.map((d) => <Cell key={d.estado} fill={d.fill} />)}
            <LabelList dataKey="total" position="top" className="fill-foreground text-xs font-medium" />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}

// ---------- 3. Alumnos con menor asistencia, contra el umbral ----------

interface AlumnoEnRiesgo {
  alumnoId: string
  nombreCompleto: string
  porcentajeGlobal: number
}

const configRiesgo = {
  porcentaje: { label: "Asistencia (%)", color: "var(--chart-4)" },
} satisfies ChartConfig

function GraficoRiesgo() {
  const [alumnos, setAlumnos] = useState<AlumnoEnRiesgo[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let vigente = true
    api.get("/reports/en-riesgo")
      .then((res) => {
        if (!vigente) return
        const lista: AlumnoEnRiesgo[] = res.data.data ?? res.data
        const ordenados = [...(Array.isArray(lista) ? lista : [])].sort((a, b) => a.porcentajeGlobal - b.porcentajeGlobal)
        setAlumnos(ordenados)
      })
      .catch(() => vigente && setError(true))
    return () => { vigente = false }
  }, [])

  if (error) return <Mensaje>No se pudo cargar el reporte de riesgo.</Mensaje>
  if (!alumnos) return <Mensaje>Cargando gráfico…</Mensaje>
  if (alumnos.length === 0) return <Mensaje>Ningún alumno está por debajo del umbral en este ámbito.</Mensaje>

  // En pantallas angostas el eje de nombres se acorta para dejar espacio a las barras.
  const estrecho = window.innerWidth < 640
  const visibles = alumnos.slice(0, ALUMNOS_EN_GRAFICO).map((a) => ({
    alumno: a.nombreCompleto,
    porcentaje: a.porcentajeGlobal,
  }))

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        {alumnos.length > visibles.length
          ? `Los ${visibles.length} con menor asistencia de ${alumnos.length} en riesgo.`
          : `${alumnos.length} alumno(s) en riesgo.`}{" "}
        La línea marca el umbral de {UMBRAL_ASISTENCIA} %.
      </p>
      <ChartContainer
        config={configRiesgo}
        className="aspect-auto w-full"
        style={{ height: Math.max(160, visibles.length * 40 + 40) }}
        role="img"
        aria-label={`Alumnos con menor asistencia: ${visibles.map((v) => `${v.alumno} ${v.porcentaje} %`).join("; ")}. Umbral ${UMBRAL_ASISTENCIA} %.`}
      >
        <BarChart data={visibles} layout="vertical" margin={{ left: 0, right: 32 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="alumno"
            width={estrecho ? 96 : 150}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => {
              const max = estrecho ? 13 : 22
              return v.length > max ? `${v.slice(0, max - 1)}…` : v
            }}
          />
          <ChartTooltip content={<ChartTooltipContent nameKey="porcentaje" />} />
          <ReferenceLine x={UMBRAL_ASISTENCIA} stroke="var(--foreground)" strokeDasharray="4 4" />
          <Bar dataKey="porcentaje" fill="var(--color-porcentaje)" radius={[0, 6, 6, 0]}>
            <LabelList dataKey="porcentaje" position="right" formatter={(v: number) => `${v}%`} className="fill-foreground text-xs font-medium" />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}

// ---------- Panel del docente ----------

export interface DiaConClases {
  dia: string
  clases: number
  hoy: boolean
}

const configDias = {
  clases: { label: "Clases", color: "var(--chart-1)" },
} satisfies ChartConfig

function GraficoClasesPorDia({ dias }: { dias: DiaConClases[] }) {
  const total = dias.reduce((n, d) => n + d.clases, 0)
  if (total === 0) return <Mensaje>Todavía no tiene clases asignadas.</Mensaje>

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">{total} clase(s) por semana. El día de hoy va resaltado.</p>
      <ChartContainer
        config={configDias}
        className="aspect-auto h-56 w-full"
        role="img"
        aria-label={`Clases por día: ${dias.map((d) => `${d.dia} ${d.clases}`).join(", ")}.`}
      >
        <BarChart data={dias} margin={{ top: 20 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="dia" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="clases" radius={[6, 6, 0, 0]}>
            {dias.map((d) => <Cell key={d.dia} fill={d.hoy ? "var(--chart-2)" : "var(--chart-1)"} />)}
            <LabelList dataKey="clases" position="top" className="fill-foreground text-xs font-medium" />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  )
}

/** Gráficos del docente: solo con datos que su rol puede consultar (su horario y su asistencia reciente). */
export function GraficosDocente({ dias }: { dias: DiaConClases[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <SeccionGrafico titulo="Mis clases por día" descripcion="Cuántas clases dicta cada día de la semana" icono={<BarChart3 className="h-4 w-4" />}>
          <GraficoClasesPorDia dias={dias} />
        </SeccionGrafico>
        <SeccionGrafico titulo="Asistencia reciente por estado" descripcion="Presentes, retardos, ausencias y justificadas" icono={<PieChartIcon className="h-4 w-4" />}>
          <GraficoAsistencia />
        </SeccionGrafico>
      </CardContent>
    </Card>
  )
}

export function GraficosDashboard(props: GraficosDashboardProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <SeccionGrafico titulo="Usuarios por tipo" descripcion="Docentes, alumnos y personal administrativo" icono={<PieChartIcon className="h-4 w-4" />}>
          <GraficoUsuarios {...props} />
        </SeccionGrafico>
        <SeccionGrafico titulo="Asistencia reciente por estado" descripcion="Presentes, retardos, ausencias y justificadas" icono={<BarChart3 className="h-4 w-4" />}>
          <GraficoAsistencia />
        </SeccionGrafico>
        <SeccionGrafico titulo="Alumnos con menor asistencia" descripcion="Comparados con el umbral institucional" icono={<TriangleAlert className="h-4 w-4" />}>
          <GraficoRiesgo />
        </SeccionGrafico>
      </CardContent>
    </Card>
  )
}
