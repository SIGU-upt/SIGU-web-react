import { useMemo, useState } from "react"

export interface SortState<K extends string> {
  key: K | null
  direction: "asc" | "desc"
}

/**
 * Ordena un arreglo ya cargado en el cliente por una de sus columnas.
 * Pensado para las tablas que no paginan contra el servidor (todo el
 * listado ya está en memoria) — revisión de factibilidad de ordenamiento,
 * comentario de Vercel en /personal-administrativo.
 */
export function useSortableData<T, K extends string>(
  data: T[],
  getValue: (item: T, key: K) => string | number,
) {
  const [sort, setSort] = useState<SortState<K>>({ key: null, direction: "asc" })

  const sorted = useMemo(() => {
    if (!sort.key) return data
    const key = sort.key
    const copia = [...data]
    copia.sort((a, b) => {
      const va = getValue(a, key)
      const vb = getValue(b, key)
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb))
      return sort.direction === "asc" ? cmp : -cmp
    })
    return copia
  }, [data, sort, getValue])

  const toggleSort = (key: K) => {
    setSort((prev) =>
      prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" },
    )
  }

  return { sorted, sort, toggleSort }
}
