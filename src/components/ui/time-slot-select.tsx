import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const STEP_MINUTES_POR_DEFECTO = 30

// Genera las horas "cerradas" del día (00:00, 00:30, 01:00, ...) según el
// paso. 30 min es lo que se usa hoy; bajarlo a 15 es solo cambiar el número —
// 5 min no aporta nada real en un horario de clases y satura la lista.
function generarOpciones(stepMinutes: number): string[] {
  const opciones: string[] = []
  for (let min = 0; min < 24 * 60; min += stepMinutes) {
    const h = Math.floor(min / 60).toString().padStart(2, '0')
    const m = (min % 60).toString().padStart(2, '0')
    opciones.push(`${h}:${m}`)
  }
  return opciones
}

interface TimeSlotSelectProps {
  id?: string
  value: string
  onChange: (value: string) => void
  stepMinutes?: number
  disabledTimes?: (time: string) => boolean
  placeholder?: string
}

// Selector de hora por lista (no slider): más simple de construir y de usar
// que un time-range picker con sub-rangos arrastrables, y alcanza el mismo
// objetivo — no dejar elegir una hora ya ocupada — marcando cada opción
// `disabled` según `disabledTimes`.
export function TimeSlotSelect({ id, value, onChange, stepMinutes = STEP_MINUTES_POR_DEFECTO, disabledTimes, placeholder }: TimeSlotSelectProps) {
  const opciones = generarOpciones(stepMinutes)
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder ?? "Seleccione una hora"} />
      </SelectTrigger>
      <SelectContent>
        {opciones.map((hora) => (
          <SelectItem key={hora} value={hora} disabled={disabledTimes?.(hora)}>
            {hora}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
