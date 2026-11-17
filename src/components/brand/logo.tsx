import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
}

/**
 * Logotipo de SIGU (mismo dibujo que `public/favicon.svg`): birrete ámbar
 * sobre cuadrado azul. Es un SVG en línea para no depender de una petición
 * extra ni del tema; el tamaño lo define quien lo usa con `className`.
 */
export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      role="img"
      aria-label="SIGU"
      className={cn("shrink-0", className)}
    >
      <rect x="8" y="8" width="240" height="240" rx="64" fill="#1a237e" />
      <g transform="translate(2 27)">
        <path
          d="M86 112 V140 Q128 164 170 140 V112 Z"
          fill="#f9a825"
          stroke="#f9a825"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <path
          d="M128 52 L222 90 L128 128 L34 90 Z"
          fill="#ffc107"
          stroke="#ffc107"
          strokeWidth="14"
          strokeLinejoin="round"
        />
        <path d="M212 92 V130" fill="none" stroke="#f9a825" strokeWidth="9" strokeLinecap="round" />
        <circle cx="212" cy="136" r="13" fill="#f9a825" />
      </g>
    </svg>
  )
}
