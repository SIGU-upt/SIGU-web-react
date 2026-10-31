import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface TextoTruncadoProps {
  // Texto completo: es lo que se ve en el tooltip (y lo que debe exportarse, nunca el recortado).
  texto: string
  // Lo que se pinta recortado; por defecto, el mismo texto.
  children?: ReactNode
  className?: string
}

/**
 * Recorta un texto largo (nombres de personas, correos) con puntos suspensivos para que no
 * ensanche la tabla, y muestra el texto completo en un tooltip al pasar el mouse o enfocarlo.
 * El tooltip solo existe cuando el texto de verdad quedó recortado: si cabe entero no repite
 * lo que ya se ve. El recorte es solo visual: los datos y las exportaciones llevan el texto entero.
 */
export function TextoTruncado({ texto, children, className }: TextoTruncadoProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [recortado, setRecortado] = useState(false)
  const [abierto, setAbierto] = useState(false)

  // Se vuelve a medir cuando cambia el texto o el ancho disponible (otra pantalla, otra columna).
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => setRecortado(el.scrollWidth > el.clientWidth)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [texto, children])

  return (
    <Tooltip open={abierto && recortado} onOpenChange={setAbierto}>
      <TooltipTrigger asChild>
        <span
          ref={ref}
          tabIndex={recortado ? 0 : undefined}
          className={cn('block max-w-[14rem] truncate sm:max-w-[18rem] lg:max-w-[22rem]', className)}
        >
          {children ?? texto}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm break-words">
        {texto}
      </TooltipContent>
    </Tooltip>
  )
}
