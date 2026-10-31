import type { SedePnf } from '@/types'

export interface OpcionSede {
  id: string
  label: string
}

/**
 * Sedes únicas derivadas de las sede-PNF, para los selects de sede.
 * El API trae `sede` con un left join: si la sede ya no existe (por ejemplo, fue eliminada y
 * quedó la sede-PNF huérfana) llega vacía. Antes se usaba el id como etiqueta, y el select
 * mostraba un UUID. Una sede sin nombre no se ofrece: no se puede identificar ni elegir con sentido.
 */
export function opcionesDeSede(sedePnfs: SedePnf[]): OpcionSede[] {
  const sedes = new Map<string, string>()
  for (const sp of sedePnfs) {
    if (sp.sede?.nombre) sedes.set(sp.sedeId, sp.sede.nombre)
  }
  return Array.from(sedes, ([id, label]) => ({ id, label }))
}
