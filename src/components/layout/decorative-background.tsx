import { Fragment } from "react"
import { useLocation } from "react-router-dom"

// Fondo decorativo sutil: un degradado casi imperceptible más 1-2 formas
// geométricas a baja opacidad, solo para darle algo de personalidad al fondo
// plano sin perder el tono formal/académico. Usa los tokens de color ya
// definidos (primary/accent) para que respete el tema claro/oscuro sin
// colores nuevos hardcodeados. Puramente decorativo: pointer-events-none y
// aria-hidden para que no interfiera con el contenido ni con lectores de
// pantalla.
//
// Composición por pantalla (regla pedida): hasta 3 formas, nunca dos
// grandes juntas — una grande sola, o 2-3 formas entre medianas y
// pequeñas (media+media, media+pequeña, pequeña+pequeña, y hasta una
// pequeña extra de acento) — para no saturar. Cada pantalla tiene su
// composición fija según la ruta; la variedad entre formas viene de una
// segunda capa: cada posición tiene 2 siluetas candidatas y cuál se usa se
// decide una sola vez por sesión del navegador (sessionStorage), así que se
// ve distinto entre un inicio de sesión y otro sin reacomodarse en cada clic.

type Forma =
  | "anillos"
  | "triangulo"
  | "cuadrado"
  | "hexagono"
  | "rombo"
  | "lineas"
  | "estrella"
  | "medialuna"
  | "pentagono"
  | "octagono"
  | "paralelogramo"
  | "trapecio"
  | "arco"
  | "cruz"
  | "zigzag"
  | "cuadrados-concentricos"

type Tamano = "grande" | "media" | "pequeña"
type Esquina = "tr" | "br" | "bl" | "tl"

interface Slot {
  // Dos siluetas candidatas para esta posición; cuál se usa depende de
  // `setIndex` (ver obtenerSetIndex), igual para toda la app en una sesión.
  opciones: [Forma, Forma]
  esquina: Esquina
  tamano: Tamano
  rotar?: string
  color: "primary" | "accent"
  opacidad: number
}

const TAMANO_CLASES: Record<Tamano, string> = {
  grande: "h-[28rem] w-[28rem]",
  media: "h-64 w-64",
  pequeña: "h-36 w-36",
}

const POSICION: Record<Esquina, Record<Tamano, string>> = {
  tr: { grande: "-right-24 -top-24", media: "-right-12 -top-12", pequeña: "-right-6 -top-6" },
  br: { grande: "-right-24 -bottom-24", media: "-right-12 -bottom-12", pequeña: "-right-6 -bottom-6" },
  bl: { grande: "-left-24 -bottom-24", media: "-left-12 -bottom-12", pequeña: "-left-6 -bottom-6" },
  tl: { grande: "-left-24 -top-24", media: "-left-12 -top-12", pequeña: "-left-6 -top-6" },
}

const VARIANTES: Record<string, Slot[]> = {
  landing: [
    { opciones: ["anillos", "hexagono"], esquina: "tr", tamano: "grande", color: "primary", opacidad: 0.08 },
    { opciones: ["estrella", "trapecio"], esquina: "bl", tamano: "pequeña", color: "accent", opacidad: 0.055 },
  ],
  auth: [
    { opciones: ["anillos", "rombo"], esquina: "tl", tamano: "media", color: "primary", opacidad: 0.075 },
    { opciones: ["hexagono", "pentagono"], esquina: "br", tamano: "media", rotar: "-rotate-6", color: "accent", opacidad: 0.07 },
    { opciones: ["cruz", "medialuna"], esquina: "bl", tamano: "pequeña", color: "primary", opacidad: 0.05 },
  ],
  dashboard: [
    { opciones: ["anillos", "estrella"], esquina: "tr", tamano: "media", color: "primary", opacidad: 0.07 },
    { opciones: ["cuadrado", "medialuna"], esquina: "bl", tamano: "pequeña", rotar: "rotate-12", color: "accent", opacidad: 0.055 },
    { opciones: ["zigzag", "arco"], esquina: "br", tamano: "pequeña", color: "accent", opacidad: 0.05 },
  ],
  usuarios: [
    { opciones: ["rombo", "cruz"], esquina: "tr", tamano: "pequeña", color: "accent", opacidad: 0.06 },
    { opciones: ["lineas", "zigzag"], esquina: "bl", tamano: "pequeña", rotar: "-rotate-6", color: "primary", opacidad: 0.055 },
    { opciones: ["pentagono", "trapecio"], esquina: "tl", tamano: "pequeña", color: "primary", opacidad: 0.05 },
  ],
  academico: [
    { opciones: ["hexagono", "octagono"], esquina: "tr", tamano: "grande", rotar: "rotate-12", color: "primary", opacidad: 0.075 },
    { opciones: ["estrella", "cruz"], esquina: "bl", tamano: "pequeña", color: "accent", opacidad: 0.05 },
  ],
  matriculas: [
    { opciones: ["triangulo", "estrella"], esquina: "br", tamano: "media", rotar: "-rotate-6", color: "accent", opacidad: 0.075 },
    { opciones: ["lineas", "trapecio"], esquina: "tl", tamano: "pequeña", color: "primary", opacidad: 0.05 },
    { opciones: ["cuadrados-concentricos", "rombo"], esquina: "tr", tamano: "pequeña", color: "primary", opacidad: 0.045 },
  ],
  reportes: [
    { opciones: ["cuadrado", "paralelogramo"], esquina: "tr", tamano: "media", rotar: "rotate-6", color: "primary", opacidad: 0.07 },
    { opciones: ["hexagono", "cuadrados-concentricos"], esquina: "bl", tamano: "media", rotar: "-rotate-12", color: "accent", opacidad: 0.065 },
    { opciones: ["arco", "medialuna"], esquina: "tl", tamano: "pequeña", color: "accent", opacidad: 0.05 },
  ],
  configuracion: [
    { opciones: ["rombo", "arco"], esquina: "tr", tamano: "pequeña", rotar: "rotate-6", color: "primary", opacidad: 0.06 },
    { opciones: ["anillos", "cruz"], esquina: "bl", tamano: "pequeña", color: "accent", opacidad: 0.055 },
    { opciones: ["octagono", "zigzag"], esquina: "br", tamano: "pequeña", color: "primary", opacidad: 0.045 },
  ],
  seguridad: [
    { opciones: ["hexagono", "estrella"], esquina: "br", tamano: "grande", color: "accent", opacidad: 0.08 },
    { opciones: ["cruz", "octagono"], esquina: "tl", tamano: "pequeña", color: "primary", opacidad: 0.05 },
  ],
  historial: [
    { opciones: ["triangulo", "octagono"], esquina: "br", tamano: "media", rotar: "rotate-12", color: "accent", opacidad: 0.07 },
    { opciones: ["cuadrado", "medialuna"], esquina: "tl", tamano: "pequeña", color: "primary", opacidad: 0.05 },
    { opciones: ["pentagono", "lineas"], esquina: "tr", tamano: "pequeña", color: "accent", opacidad: 0.045 },
  ],
  default: [
    { opciones: ["anillos", "pentagono"], esquina: "tr", tamano: "pequeña", color: "primary", opacidad: 0.05 },
    { opciones: ["rombo", "zigzag"], esquina: "bl", tamano: "pequeña", color: "accent", opacidad: 0.05 },
    { opciones: ["trapecio", "arco"], esquina: "tl", tamano: "pequeña", color: "primary", opacidad: 0.045 },
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
  const claseBase = `absolute ${CLASE_COLOR[slot.color]} ${POSICION[slot.esquina][slot.tamano]} ${TAMANO_CLASES[slot.tamano]} ${slot.rotar ?? ""}`
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
          <path d="M140 30 A70 70 0 1 0 140 170 A55 55 0 1 1 140 30 Z" fill="currentColor" stroke="none" />
        </svg>
      )
    case "pentagono":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <polygon points="100,10 186,72 153,173 47,173 14,72" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case "octagono":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <polygon points="45,10 155,10 190,45 190,155 155,190 45,190 10,155 10,45" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case "paralelogramo":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <polygon points="50,40 190,40 150,160 10,160" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case "trapecio":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <polygon points="60,30 140,30 180,170 20,170" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case "arco":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <path d="M20 150 A80 80 0 0 1 180 150" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case "cruz":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <polygon
            points="75,15 125,15 125,75 185,75 185,125 125,125 125,185 75,185 75,125 15,125 15,75 75,75"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "zigzag":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <polyline points="10,70 55,140 100,70 145,140 190,70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case "cuadrados-concentricos":
      return (
        <svg className={claseBase} style={style} viewBox="0 0 200 200" fill="none">
          <rect x="10" y="10" width="180" height="180" rx="20" stroke="currentColor" strokeWidth="2" />
          <rect x="50" y="50" width="100" height="100" rx="14" stroke="currentColor" strokeWidth="2" />
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
