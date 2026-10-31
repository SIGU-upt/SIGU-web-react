// Equivalente en el frontend de `hoyLocal()` (SIGU-api-nest/src/common/utils/fecha.helper.ts).
//
// `new Date().toISOString().split('T')[0]` devuelve la fecha en UTC. Venezuela
// es UTC−4, así que entre las 20:00 y la medianoche local esa expresión ya
// devuelve el día siguiente — el backend ya corrige esto, pero el frontend
// seguía usando el cálculo en UTC, así que un `<input max={hoy}>` nocturno
// permitía una fecha que el servidor luego rechazaba como futura.
const ZONA_HORARIA = 'America/Caracas'

const FORMATEADOR = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Fecha actual en la zona horaria del sistema, en formato `YYYY-MM-DD`. */
export function hoyLocal(referencia: Date = new Date()): string {
  return FORMATEADOR.format(referencia)
}

/** Días de plazo para justificar una falta (el API rechaza con 400 lo que pase de este límite). */
export const DIAS_PLAZO_JUSTIFICACION = 7

/**
 * ¿Se puede todavía justificar una falta de esa fecha (`YYYY-MM-DD`)? Misma cuenta que
 * `assertDentroVentanaJustificacion` del API: hasta 7 días después de la falta, inclusive.
 */
export function dentroDelPlazoDeJustificacion(fecha: string, hoy: string = hoyLocal()): boolean {
  const dias = Math.floor((Date.parse(hoy) - Date.parse(fecha)) / 86_400_000)
  return dias <= DIAS_PLAZO_JUSTIFICACION
}
