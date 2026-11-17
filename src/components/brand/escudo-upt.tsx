import { cn } from "@/lib/utils"

interface EscudoUptProps {
  className?: string
}

/**
 * Sello oficial de la Universidad Politécnica Territorial "José Félix
 * Ribas". La imagen trae su propio fondo claro, por eso se muestra dentro de
 * un recuadro redondeado que se ve igual en tema claro y oscuro.
 */
export function EscudoUpt({ className }: EscudoUptProps) {
  return (
    <img
      src="/escudo-upt.webp"
      alt="Universidad Politécnica Territorial José Félix Ribas"
      width={320}
      height={320}
      className={cn("shrink-0 rounded-2xl object-cover", className)}
    />
  )
}
