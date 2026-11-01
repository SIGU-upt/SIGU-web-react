import { Fragment } from "react"
import { useLocation } from "react-router-dom"

// Fondo decorativo sutil: un degradado casi imperceptible más 2-3 formas
// geométricas a baja opacidad, solo para darle algo de personalidad al fondo
// plano sin perder el tono formal/académico. Usa los tokens de color ya
// definidos (primary/accent) para que respete el tema claro/oscuro sin
// colores nuevos hardcodeados. Puramente decorativo: pointer-events-none y
// aria-hidden para que no interfiera con el contenido ni con lectores de
// pantalla.
//
// Cada pantalla recibe una combinación de formas fija (elegida según la
// ruta actual), para no generar ruido visual al navegar entre pantallas de
// un mismo módulo. La variedad entre formas viene de una segunda capa: cada
// posición tiene 2 siluetas candidatas y cuál de las dos se usa se decide
// una sola vez por sesión del navegador (sessionStorage), así que se ve
// distinto entre un inicio de sesión y otro sin reacomodarse en cada clic.

type Forma = "anillos" | "triangulo" | "cuadrado" | "hexagono" | "rombo" | "lineas" | "estrella" | "medialuna"

interface Slot {
  // Dos siluetas candidatas para esta posición; cuál se usa depende de
  // `setIndex` (ver obtenerSetIndex), igual para toda la app en una sesión.
  opciones: [Forma, Forma]
  clase: string // posición, tamaño y rotación (Tailwind)
  color: "primary" | "accent"
  opacidad: number
}

const VARIANTES: Record<string, Slot[]> = {
  landing: [
    { opciones: ["anillos", "hexagono"], clase: "-right-24 -top-24 h-[30rem] w-[30rem]", color: "primary", opacidad: 0.08 },
    { opciones: ["triangulo", "estrella"], clase: "-bottom-32 -left-20 h-[26rem] w-[26rem] rotate-12", color: "accent", opacidad: 0.08 },
    { opciones: ["medialuna", "rombo"], clase: "right-0 top-1/2 h-48 w-48 -translate-y-1/2 translate-x-1/3", color: "accent", opacidad: 0.06 },
  ],
  auth: [
    { opciones: ["anillos", "rombo"], clase: "-left-20 -top-24 h-[26rem] w-[26rem]", color: "primary", opacidad: 0.08 },
    { opciones: ["hexagono", "triangulo"], clase: "-bottom-28 -right-16 h-72 w-72 -rotate-6", color: "accent", opacidad: 0.075 },
    { opciones: ["estrella", "medialuna"], clase: "left-1/2 bottom-10 h-40 w-40 -translate-x-1/2", color: "primary", opacidad: 0.05 },
  ],
  dashboard: [
    { opciones: ["anillos", "estrella"], clase: "-right-24 -top-24 h-[28rem] w-[28rem]", color: "primary", opacidad: 0.07 },
    { opciones: ["cuadrado", "hexagono"], clase: "-bottom-28 -left-16 h-64 w-64 rotate-12", color: "accent", opacidad: 0.065 },
    { opciones: ["medialuna", "rombo"], clase: "-left-10 top-1/4 h-40 w-40", color: "accent", opacidad: 0.05 },
  ],
  usuarios: [
    { opciones: ["rombo", "cuadrado"], clase: "-right-16 top-1/4 h-64 w-64", color: "accent", opacidad: 0.07 },
    { opciones: ["lineas", "triangulo"], clase: "-bottom-24 -left-24 h-80 w-80 -rotate-6", color: "primary", opacidad: 0.06 },
    { opciones: ["estrella", "anillos"], clase: "-top-10 left-1/3 h-40 w-40", color: "primary", opacidad: 0.05 },
  ],
  academico: [
    { opciones: ["hexagono", "anillos"], clase: "-right-20 -top-16 h-[26rem] w-[26rem] rotate-12", color: "primary", opacidad: 0.07 },
    { opciones: ["anillos", "rombo"], clase: "-bottom-28 -left-20 h-72 w-72", color: "accent", opacidad: 0.065 },
    { opciones: ["medialuna", "lineas"], clase: "right-10 bottom-10 h-40 w-40", color: "accent", opacidad: 0.05 },
  ],
  matriculas: [
    { opciones: ["triangulo", "estrella"], clase: "-right-20 -bottom-20 h-[26rem] w-[26rem] -rotate-6", color: "accent", opacidad: 0.075 },
    { opciones: ["lineas", "cuadrado"], clase: "-top-16 -left-16 h-72 w-72 rotate-6", color: "primary", opacidad: 0.06 },
    { opciones: ["rombo", "hexagono"], clase: "left-1/2 top-10 h-36 w-36 -translate-x-1/2", color: "primary", opacidad: 0.045 },
  ],
  reportes: [
    { opciones: ["cuadrado", "rombo"], clase: "-right-16 -top-20 h-80 w-80 rotate-6", color: "primary", opacidad: 0.07 },
    { opciones: ["hexagono", "anillos"], clase: "-bottom-24 -left-24 h-72 w-72 -rotate-12", color: "accent", opacidad: 0.065 },
    { opciones: ["estrella", "triangulo"], clase: "right-1/4 bottom-6 h-36 w-36", color: "accent", opacidad: 0.05 },
  ],
  configuracion: [
    { opciones: ["rombo", "hexagono"], clase: "-right-20 -top-20 h-80 w-80 rotate-6", color: "primary", opacidad: 0.07 },
    { opciones: ["anillos", "cuadrado"], clase: "-bottom-28 -left-16 h-64 w-64", color: "accent", opacidad: 0.06 },
    { opciones: ["lineas", "medialuna"], clase: "-left-6 top-10 h-36 w-36", color: "primary", opacidad: 0.045 },
  ],
  seguridad: [
    { opciones: ["hexagono", "estrella"], clase: "-right-16 -bottom-20 h-80 w-80", color: "accent", opacidad: 0.075 },
    { opciones: ["lineas", "anillos"], clase: "-top-20 -left-20 h-72 w-72 rotate-12", color: "primary", opacidad: 0.06 },
    { opciones: ["rombo", "triangulo"], clase: "right-10 top-1/3 h-36 w-36", color: "primary", opacidad: 0.045 },
  ],
  historial: [
    { opciones: ["cuadrado", "lineas"], clase: "left-1/2 top-1/3 h-72 w-72 -translate-x-1/2", color: "primary", opacidad: 0.055 },
    { opciones: ["triangulo", "hexagono"], clase: "-bottom-28 -right-20 h-80 w-80 rotate-12", color: "accent", opacidad: 0.07 },
    { opciones: ["medialuna", "estrella"], clase: "-top-10 -left-10 h-36 w-36", color: "accent", opacidad: 0.05 },
  ],
  default: [
    { opciones: ["anillos", "hexagono"], clase: "-right-24 -top-24 h-[26rem] w-[26rem]", color: "primary", opacidad: 0.06 },
    { opciones: ["rombo", "cuadrado"], clase: "-bottom-24 -left-20 h-64 w-64", color: "accent", opacidad: 0.06 },
    { opciones: ["estrella", "triangulo"], clase: "right-10 top-10 h-32 w-32", color: "primary", opacidad: 0.045 },
  ],
}

function varianteParaRuta(pathname: string): Slot[] {
  if (pathname === "/") return VARIANTES.landing
  if (pathname.startsWith("/login") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password")) return VARIANTES.auth
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

// Decide una vez por pestaña/sesión cuál de las 2 siluetas candidatas de
// cada posición se usa — no en cada render ni en cada cambio de pantalla,
// para que el fondo no "salte" mientras se navega dentro de una sesión.
const SEED_KEY = "sigu_decor_set"

function obtenerSetIndex(): 0 | 1 {
  try {
    const guardado = sessionStorage.getItem(SEED_KEY)
    if (guardado === "0" || guardado === "1") return guardado === "1" ? 1 : 0
    const nuevo: 0 | 1 = Math.random() < 0.5 ? 0 : 1
    sessionStorage.setItem(SEED_KEY, String(nuevo))
    return nuevo
  } catch {
    return 0
  }
}

const CLASE_COLOR: Record<Slot["color"], string> = {
  primary: "text-primary",
  accent: "text-accent",
}

function renderForma(slot: Slot, setIndex: 0 | 1) {
  const forma = slot.opciones[setIndex]
  const claseBase = `absolute ${CLASE_COLOR[slot.color]} ${slot.clase}`
  const style = { opacity: slot.opacidad }
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
    case "estrella":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <polygon
            points="100,10 122,69 186,72 136,112 153,173 100,138 47,173 64,112 14,72 78,69"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "medialuna":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <path
            d="M140 30 A70 70 0 1 0 140 170 A55 55 0 1 1 140 30 Z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      )
  }
}

export function DecorativeBackground() {
  const { pathname } = useLocation()
  const slots = varianteParaRuta(pathname)
  const setIndex = obtenerSetIndex()

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 15% 0%, color-mix(in srgb, var(--color-primary) 9%, transparent), transparent), " +
          "radial-gradient(ellipse 60% 40% at 100% 100%, color-mix(in srgb, var(--color-accent) 9%, transparent), transparent)",
      }}
    >
      {slots.map((slot, i) => (
        <Fragment key={i}>{renderForma(slot, setIndex)}</Fragment>
      ))}
    </div>
  )
}
