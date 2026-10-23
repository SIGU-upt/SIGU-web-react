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
