import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { opcionesDeSede } from "@/lib/opciones-sede"
import type { SedePnf } from "@/types"

interface SedePnfCascadeFilterProps {
  sedePnfOptions: SedePnf[]
  /** El coordinador solo tiene una sede-PNF propia: el backend ya lo acota, así que
   * el filtro nunca tendría más de una opción real — no se muestra. */
  esCoordinador: boolean
  sedeId: string
  pnfId: string
  onSedeChange: (sedeId: string) => void
  onPnfChange: (pnfId: string) => void
  sedePlaceholder?: string
  pnfPlaceholderConSede?: string
  pnfPlaceholderSinSede?: string
}

/** Filtro cascada sede → PNF reutilizado por las pestañas de Reportes que acotan por jurisdicción. */
export function SedePnfCascadeFilter({
  sedePnfOptions,
  esCoordinador,
  sedeId,
  pnfId,
  onSedeChange,
  onPnfChange,
  sedePlaceholder = "Seleccione una sede",
  pnfPlaceholderConSede = "Seleccione un PNF",
  pnfPlaceholderSinSede = "Elija primero una sede",
}: SedePnfCascadeFilterProps) {
  if (esCoordinador) return null

  const sedeOptions = opcionesDeSede(sedePnfOptions)
  const pnfOptions = sedePnfOptions
    .filter((sp) => !sedeId || sp.sedeId === sedeId)
    .map((sp) => ({ id: sp.id, label: sp.pnf?.nombre ?? sp.id }))

  return (
    <>
      <Select value={sedeId} onValueChange={onSedeChange}>
        <SelectTrigger className="max-w-xs"><SelectValue placeholder={sedePlaceholder} /></SelectTrigger>
        <SelectContent>
          {sedeOptions.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={pnfId} onValueChange={onPnfChange} disabled={!sedeId}>
        <SelectTrigger className="max-w-xs"><SelectValue placeholder={sedeId ? pnfPlaceholderConSede : pnfPlaceholderSinSede} /></SelectTrigger>
        <SelectContent>
          {pnfOptions.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
