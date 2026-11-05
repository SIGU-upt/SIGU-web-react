import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"

interface TableSkeletonRowsProps {
  columns: number
  rows?: number
  // students-table/professors-table: la primera columna es un Avatar +
  // nombre/correo en dos líneas, no una sola barra — sin esto el skeleton
  // tenía una forma distinta a la fila real que lo reemplaza.
  avatarColumn?: boolean
}

/**
 * Filas de relleno para un <TableBody>, en vez del "Cargando..." centrado que
 * tenía cada tabla — ya tiene la forma de la tabla real, así que el salto al
 * llegar los datos es menor. Se usa en el mismo lugar donde antes iba la fila
 * con el texto, con el mismo `colSpan`/cantidad de columnas de esa tabla.
 */
export function TableSkeletonRows({ columns, rows = 5, avatarColumn = false }: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {avatarColumn && (
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </TableCell>
          )}
          {Array.from({ length: avatarColumn ? columns - 1 : columns }).map((_, j) => (
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

/** Fila pareja de tarjetas de cifras (Dashboard del docente) — mismo criterio que ListSkeleton. */
export function StatCardsSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-lg" />
      ))}
    </div>
  )
}

/**
 * Para el Dashboard administrativo, que NO es una fila pareja de tarjetas: una
 * tarjeta grande (Total Usuarios, lg:col-span-2) a la izquierda, y a la
 * derecha una tarjeta (Docentes/Alumnos) + una subgrilla 2x2 (Total Clases,
 * Inscripciones). Mismas clases que el layout real (dashboard/index.tsx) para
 * que al llegar los datos no cambie de forma.
 */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-56 w-full rounded-lg lg:col-span-2" />
      <div className="contents lg:flex lg:flex-col lg:col-span-2 lg:justify-between lg:gap-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="contents lg:grid lg:grid-cols-2 lg:gap-4">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
