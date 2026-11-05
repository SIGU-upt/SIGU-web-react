import { Skeleton } from "@/components/ui/skeleton"

/**
 * Silueta genérica para las pantallas de detalle (Sede, PNF, Sección) mientras
 * cargan — título + badges de resumen + un bloque grande, en vez del
 * "Cargando..." centrado que reemplazaba toda la pantalla. No intenta copiar
 * cada pantalla exacto (cada una es distinta), solo dar una forma reconocible
 * para que el salto al llegar los datos sea menor.
 */
export function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-56" />
        </div>
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}
