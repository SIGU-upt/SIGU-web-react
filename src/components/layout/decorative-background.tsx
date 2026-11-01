import { useLocation } from "react-router-dom"

// Fondo decorativo sutil: un degradado casi imperceptible más 2-3 formas
// geométricas grandes a baja opacidad, solo para darle algo de personalidad
// al fondo plano sin perder el tono formal/académico. Usa los tokens de color
// ya definidos (primary/accent) para que respete el tema claro/oscuro sin
// colores nuevos hardcodeados. Puramente decorativo: pointer-events-none y
// aria-hidden para que no interfiera con el contenido ni con lectores de
// pantalla.
//
// Cada pantalla recibe una combinación distinta de forma/posición/rotación
// (la "variante"), elegida según la ruta actual, para que el fondo no se
// sienta repetido entre módulos sin dejar de ser el mismo sistema visual.

type Forma = "anillos" | "triangulo" | "cuadrado" | "hexagono" | "rombo" | "lineas"

interface FormaConfig {
  forma: Forma
  clase: string // posición, tamaño y rotación (Tailwind)
  color: "primary" | "accent"
  opacidad: number
}

interface Variante {
  forma1: FormaConfig
  forma2: FormaConfig
}

const VARIANTES: Record<string, Variante> = {
  landing: {
    forma1: { forma: "anillos", clase: "-right-24 -top-24 h-[30rem] w-[30rem]", color: "primary", opacidad: 0.07 },
    forma2: { forma: "triangulo", clase: "-bottom-32 -left-20 h-[26rem] w-[26rem] rotate-12", color: "accent", opacidad: 0.08 },
  },
  dashboard: {
    forma1: { forma: "anillos", clase: "-right-24 -top-24 h-[28rem] w-[28rem]", color: "primary", opacidad: 0.06 },
    forma2: { forma: "cuadrado", clase: "-bottom-28 -left-16 h-64 w-64 rotate-12", color: "accent", opacidad: 0.055 },
  },
  usuarios: {
    forma1: { forma: "rombo", clase: "-right-16 top-1/4 h-64 w-64", color: "accent", opacidad: 0.06 },
    forma2: { forma: "lineas", clase: "-bottom-24 -left-24 h-80 w-80 -rotate-6", color: "primary", opacidad: 0.05 },
  },
  academico: {
    forma1: { forma: "hexagono", clase: "-right-20 -top-16 h-[26rem] w-[26rem] rotate-12", color: "primary", opacidad: 0.06 },
    forma2: { forma: "anillos", clase: "-bottom-28 -left-20 h-72 w-72", color: "accent", opacidad: 0.055 },
  },
  matriculas: {
    forma1: { forma: "triangulo", clase: "-right-20 -bottom-20 h-[26rem] w-[26rem] -rotate-6", color: "accent", opacidad: 0.065 },
    forma2: { forma: "lineas", clase: "-top-16 -left-16 h-72 w-72 rotate-6", color: "primary", opacidad: 0.05 },
  },
  reportes: {
    forma1: { forma: "cuadrado", clase: "-right-16 -top-20 h-80 w-80 rotate-6", color: "primary", opacidad: 0.06 },
    forma2: { forma: "hexagono", clase: "-bottom-24 -left-24 h-72 w-72 -rotate-12", color: "accent", opacidad: 0.055 },
  },
  configuracion: {
    forma1: { forma: "rombo", clase: "-right-20 -top-20 h-80 w-80 rotate-6", color: "primary", opacidad: 0.06 },
    forma2: { forma: "anillos", clase: "-bottom-28 -left-16 h-64 w-64", color: "accent", opacidad: 0.05 },
  },
  seguridad: {
    forma1: { forma: "hexagono", clase: "-right-16 -bottom-20 h-80 w-80", color: "accent", opacidad: 0.065 },
    forma2: { forma: "lineas", clase: "-top-20 -left-20 h-72 w-72 rotate-12", color: "primary", opacidad: 0.05 },
  },
  historial: {
    forma1: { forma: "cuadrado", clase: "left-1/2 top-1/3 h-72 w-72 -translate-x-1/2", color: "primary", opacidad: 0.045 },
    forma2: { forma: "triangulo", clase: "-bottom-28 -right-20 h-80 w-80 rotate-12", color: "accent", opacidad: 0.06 },
  },
  default: {
    forma1: { forma: "anillos", clase: "-right-24 -top-24 h-[26rem] w-[26rem]", color: "primary", opacidad: 0.05 },
    forma2: { forma: "rombo", clase: "-bottom-24 -left-20 h-64 w-64", color: "accent", opacidad: 0.05 },
  },
}

function varianteParaRuta(pathname: string): Variante {
  if (pathname === "/") return VARIANTES.landing
  if (pathname.startsWith("/dashboard")) return VARIANTES.dashboard
  if (pathname.startsWith("/docentes") || pathname.startsWith("/estudiantes") || pathname.startsWith("/personal-administrativo")) return VARIANTES.usuarios
  if (pathname.startsWith("/unidades") || pathname.startsWith("/secciones") || pathname.startsWith("/clases-suspendidas")) return VARIANTES.academico
  if (pathname.startsWith("/matriculas") || pathname.startsWith("/inconsistencias")) return VARIANTES.matriculas
  if (pathname.startsWith("/reportes")) return VARIANTES.reportes
  if (pathname.startsWith("/configuracion") || pathname.startsWith("/sedes") || pathname.startsWith("/pnfs")) return VARIANTES.configuracion
  if (pathname.startsWith("/security-logs")) return VARIANTES.seguridad
  if (pathname.startsWith("/historial")) return VARIANTES.historial
  return VARIANTES.default
}

const CLASE_COLOR: Record<FormaConfig["color"], string> = {
  primary: "text-primary",
  accent: "text-accent",
}

function renderForma({ forma, clase, color, opacidad }: FormaConfig) {
  const claseBase = `absolute ${CLASE_COLOR[color]} ${clase}`
  const style = { opacity: opacidad }
  switch (forma) {
    case "anillos":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="95" stroke="currentColor" strokeWidth="2" />
          <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case "triangulo":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <polygon points="100,10 190,170 10,170" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case "cuadrado":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <rect x="10" y="10" width="180" height="180" rx="24" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case "hexagono":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <polygon points="100,5 185,52 185,148 100,195 15,148 15,52" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case "rombo":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <rect x="35" y="35" width="130" height="130" rx="16" stroke="currentColor" strokeWidth="2" transform="rotate(45 100 100)" />
        </svg>
      )
    case "lineas":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <line x1="0" y1="40" x2="200" y2="40" stroke="currentColor" strokeWidth="2" />
          <line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" strokeWidth="2" />
          <line x1="0" y1="160" x2="200" y2="160" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
  }
}

export function DecorativeBackground() {
  const { pathname } = useLocation()
  const { forma1, forma2 } = varianteParaRuta(pathname)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 15% 0%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent), " +
          "radial-gradient(ellipse 60% 40% at 100% 100%, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent)",
      }}
    >
      {renderForma(forma1)}
      {renderForma(forma2)}
    </div>
  )
}
