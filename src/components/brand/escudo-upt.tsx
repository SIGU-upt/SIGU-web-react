import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const NOMBRE = "Universidad Politécnica Territorial del Estado Barinas José Félix Ribas"

interface EscudoUptProps {
  className?: string
}

/**
 * Escudo oficial de la Universidad Politécnica Territorial "José Félix
 * Ribas". La imagen trae su propio fondo blanco, por eso se muestra dentro de
 * un recuadro redondeado que se ve igual en tema claro y oscuro. Al hacer clic
 * se abre ampliado: en el pie es tan pequeño que se pierden los detalles.
 */
export function EscudoUpt({ className }: EscudoUptProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Ampliar el escudo de la universidad"
          className={cn(
            "shrink-0 cursor-zoom-in overflow-hidden rounded-xl bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            className,
          )}
        >
          <img src="/escudo-upt.webp" alt={NOMBRE} width={480} height={480} className="h-full w-full object-contain" />
        </button>
      </DialogTrigger>
      <DialogContent className="w-fit max-w-[calc(100vw-2rem)] gap-0 bg-white p-4 text-neutral-700 sm:max-w-md">
        <DialogTitle className="sr-only">Escudo de la universidad</DialogTitle>
        <DialogDescription className="sr-only">{NOMBRE}</DialogDescription>
        <img src="/escudo-upt.webp" alt={NOMBRE} className="mx-auto max-h-[75vh] w-full max-w-sm object-contain" />
      </DialogContent>
    </Dialog>
  )
}
