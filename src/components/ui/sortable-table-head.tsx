import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { SortState } from "@/hooks/use-sortable-data"

interface SortableTableHeadProps<K extends string> {
  sortKey: K
  sort: SortState<K>
  onSort: (key: K) => void
  className?: string
  children: React.ReactNode
}

/** `<TableHead>` clicable que delega el estado a `useSortableData`. */
export function SortableTableHead<K extends string>({
  sortKey,
  sort,
  onSort,
  className,
  children,
}: SortableTableHeadProps<K>) {
  const activo = sort.key === sortKey
  const Icono = activo ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {children}
        <Icono className={cn("h-3.5 w-3.5", activo ? "text-foreground" : "text-muted-foreground/50")} />
      </button>
    </TableHead>
  )
}
