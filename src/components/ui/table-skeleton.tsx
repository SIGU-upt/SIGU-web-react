import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"

interface TableSkeletonRowsProps {
  columns: number
  rows?: number
}

/**
 * Filas de relleno para un <TableBody>, en vez del "Cargando..." centrado que
 * tenía cada tabla — ya tiene la forma de la tabla real, así que el salto al
 * llegar los datos es menor. Se usa en el mismo lugar donde antes iba la fila
 * con el texto, con el mismo `colSpan`/cantidad de columnas de esa tabla.
 */
export function TableSkeletonRows({ columns, rows = 5 }: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full max-w-[160px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

/**
 * Para las pantallas que esconden la tabla entera (encabezado incluido)
 * mientras carga, en vez de solo el `<TableBody>` — una pila de barras en el
 * mismo lugar donde iba el "Cargando..." centrado, sin tener que reestructurar
 * cada pantalla para mantener visible el encabezado real.
 */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  )
}

/** Fila de tarjetas de cifras (dashboards) — mismo criterio que ListSkeleton. */
export function StatCardsSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-lg" />
      ))}
    </div>
  )
}
