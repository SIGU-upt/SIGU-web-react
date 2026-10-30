import { toast } from 'sonner'
import type { GenerarEstructuraResultado, GenerarPeriodosResultado } from '@/types'

// Aviso tras POST /pnfs/:id/generar-estructura. El servidor responde con conteos
// (trayectosCreados, tramosCreados); si ambos son 0 es porque la estructura ya existía.
export function avisarEstructuraGenerada({ trayectosCreados, tramosCreados }: GenerarEstructuraResultado) {
  if (trayectosCreados === 0 && tramosCreados === 0) {
    toast.info('La estructura ya existía: no se creó nada nuevo.')
    return
  }
  toast.success(`Estructura generada: ${trayectosCreados} trayecto(s) y ${tramosCreados} tramo(s) creado(s).`)
}

// Aviso tras POST /periodos/generar. Las sede-PNF donde no se pudo crear llegan en
// `omitidos` con su motivo; se muestran juntos (sin repetir) para que se entienda por qué.
export function avisarPeriodosGenerados({ creados, omitidos, advertencias }: GenerarPeriodosResultado) {
  if (creados.length > 0) {
    toast.success(`Período creado en ${creados.length} sede-PNF.`)
  }
  if (omitidos.length > 0) {
    const motivos = [...new Set(omitidos.map((o) => o.motivo))].slice(0, 2).join(' · ')
    const mensaje = `${omitidos.length} sede-PNF omitida(s): ${motivos}`
    if (creados.length > 0) toast.warning(mensaje)
    else toast.error(mensaje)
  }
  if (creados.length === 0 && omitidos.length === 0) {
    toast.info('No se creó ningún período.')
  }
  advertencias?.forEach((a) => toast.warning(a))
}
