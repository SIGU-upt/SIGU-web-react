
export interface ScheduleGridEntry {
  id: string
  diaSemana: string
  horaInicio: string
  horaFin: string
  materia: string
  docente?: string | null
  grupo?: string | null
  aula?: string | null
}

const DIA_ORDEN = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']
const DIA_LABEL: Record<string, string> = {
  LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
}

interface WeeklyScheduleGridProps {
  entries: ScheduleGridEntry[]
  emptyMessage?: string
}

// Formato de grilla real usado en la institución (horario impreso semanal):
// filas = horas de inicio distintas presentes en los datos, columnas = solo
// los días que tienen alguna clase. No asume una ventana fija de horas ni de
// días — un turno de fin de semana solo muestra Sábado/Domingo, uno de
// semana solo Lunes-Viernes, y el horario de un docente que dicta en varias
// secciones con turnos distintos muestra ambos bloques sin configuración.
export function WeeklyScheduleGrid({ entries, emptyMessage = "No hay clases con horario asignado." }: WeeklyScheduleGridProps) {
  if (entries.length === 0) {
    return <p className="text-center py-8 text-sm text-muted-foreground">{emptyMessage}</p>
  }

  const dias = DIA_ORDEN.filter((d) => entries.some((e) => e.diaSemana === d))
  const horas = Array.from(new Set(entries.map((e) => e.horaInicio))).sort()

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide w-20">Hora</th>
            {dias.map((d) => (
              <th key={d} className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide">{DIA_LABEL[d]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {horas.map((hora, i) => (
            <tr key={hora} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
              <td className="px-3 py-2.5 align-top text-xs font-medium text-muted-foreground tabular-nums border-t border-border">
                {hora.slice(0, 5)}
              </td>
              {dias.map((dia) => {
                const celdas = entries.filter((e) => e.diaSemana === dia && e.horaInicio === hora)
                return (
                  <td key={dia} className="px-3 py-2.5 align-top border-t border-l border-border">
                    {celdas.length > 0 && (
                      <div className="space-y-2">
                        {celdas.map((c) => (
                          <div key={c.id} className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1.5">
                            <p className="font-semibold text-foreground leading-tight">{c.materia}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{c.horaInicio.slice(0, 5)}–{c.horaFin.slice(0, 5)}</p>
                            {c.docente && <p className="text-xs text-muted-foreground">{c.docente}</p>}
                            {(c.grupo || c.aula) && (
                              <p className="text-xs text-muted-foreground">{[c.grupo, c.aula].filter(Boolean).join(' · ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
