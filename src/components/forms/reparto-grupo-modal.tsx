import { useState, useEffect, useMemo } from "react"
import { Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { FormError } from "@/components/ui/form-error"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { type AlumnoCohorte } from "@/types"

interface GrupoDestino {
  claseId: string
  nombreGrupo: string
}

interface BatchResult {
  inscripcionesCreadas: number
  yaInscritas: number
  errores: { claseId: string; motivo: string }[]
}

interface ErrorConAtribucion {
  alumnoId: string
  motivo: string
}

interface RepartoGrupoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  matricula: AlumnoCohorte[]
  grupos: [GrupoDestino, GrupoDestino]
  onSubmit: (alumnoId: string, claseId: string) => Promise<BatchResult>
}

type Criterio = 'cedula' | 'nombre' | 'fechaIngreso' | 'manual'

// La mitad "primero" puede quedar con un alumno más que la segunda cuando la
// matrícula es impar — repartir 1 de más no tiene impacto real y evita tener
// que decidir a quién "sobra".
function dividirEnMitades<T>(lista: T[]): [T[], T[]] {
  const corte = Math.ceil(lista.length / 2)
  return [lista.slice(0, corte), lista.slice(corte)]
}

export function RepartoGrupoModal({ open, onOpenChange, matricula, grupos, onSubmit }: RepartoGrupoModalProps) {
  const [criterio, setCriterio] = useState<Criterio>('nombre')
  // alumnoId -> 0 (grupo[0]) | 1 (grupo[1]), solo para el criterio "manual".
  const [asignacionManual, setAsignacionManual] = useState<Record<string, 0 | 1>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ inscripcionesCreadas: number; yaInscritas: number; errores: ErrorConAtribucion[] } | null>(null)

  useEffect(() => {
    if (!open) return
    setCriterio('nombre')
    setError(null)
    setResultado(null)
    // Punto de partida razonable para "manual": la misma mitad por nombre,
    // que el usuario puede reacomodar alumno por alumno.
    const [primera] = dividirEnMitades(
      [...matricula].sort((a, b) => (a.alumno?.nombreCompleto ?? '').localeCompare(b.alumno?.nombreCompleto ?? '')),
    )
    const primeraIds = new Set(primera.map((ac) => ac.alumnoId))
    const inicial: Record<string, 0 | 1> = {}
    matricula.forEach((ac) => { inicial[ac.alumnoId] = primeraIds.has(ac.alumnoId) ? 0 : 1 })
    setAsignacionManual(inicial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const asignacionAutomatica = useMemo(() => {
    if (criterio === 'manual') return null
    const comparador: Record<Exclude<Criterio, 'manual'>, (a: AlumnoCohorte, b: AlumnoCohorte) => number> = {
      cedula: (a, b) => (a.alumno?.ci ?? '').localeCompare(b.alumno?.ci ?? ''),
      nombre: (a, b) => (a.alumno?.nombreCompleto ?? '').localeCompare(b.alumno?.nombreCompleto ?? ''),
      fechaIngreso: (a, b) => (a.alumno?.createdAt ?? '').localeCompare(b.alumno?.createdAt ?? ''),
    }
    const ordenada = [...matricula].sort(comparador[criterio])
    const [primera, segunda] = dividirEnMitades(ordenada)
    const mapa: Record<string, 0 | 1> = {}
    primera.forEach((ac) => { mapa[ac.alumnoId] = 0 })
    segunda.forEach((ac) => { mapa[ac.alumnoId] = 1 })
    return mapa
  }, [criterio, matricula])

  const asignacionEfectiva = asignacionAutomatica ?? asignacionManual

  const conteoPorGrupo = useMemo(() => {
    let g0 = 0, g1 = 0
    matricula.forEach((ac) => { if (asignacionEfectiva[ac.alumnoId] === 1) g1++; else g0++ })
    return [g0, g1] as const
  }, [matricula, asignacionEfectiva])

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const resultados = await Promise.all(
        matricula.map(async (ac) => {
          const grupoIdx = asignacionEfectiva[ac.alumnoId] ?? 0
          const r = await onSubmit(ac.alumnoId, grupos[grupoIdx].claseId)
          return { alumnoId: ac.alumnoId, ...r }
        }),
      )
      const agregado = resultados.reduce((acc, r) => {
        acc.inscripcionesCreadas += r.inscripcionesCreadas
        acc.yaInscritas += r.yaInscritas
        acc.errores.push(...r.errores.map((e) => ({ alumnoId: r.alumnoId, motivo: e.motivo })))
        return acc
      }, { inscripcionesCreadas: 0, yaInscritas: 0, errores: [] as ErrorConAtribucion[] })
      setResultado(agregado)
    } catch {
      setError('No se pudo completar el reparto. Algunos alumnos pueden haber quedado sin inscribir.')
    } finally {
      setLoading(false)
    }
  }

  const alumnoNombre = (alumnoId: string) => matricula.find((ac) => ac.alumnoId === alumnoId)?.alumno?.nombreCompleto ?? alumnoId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Repartir la matrícula entre los 2 grupos</DialogTitle>
          <DialogDescription>
            {grupos[0].nombreGrupo} y {grupos[1].nombreGrupo} ya se crearon. Elija cómo repartir a los {matricula.length} alumno(s) de esta matrícula entre ambos antes de inscribirlos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Criterio de reparto</Label>
            <Select value={criterio} onValueChange={(v) => setCriterio(v as Criterio)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nombre">Por nombre (mitad y mitad)</SelectItem>
                <SelectItem value="cedula">Por cédula (mitad y mitad)</SelectItem>
                <SelectItem value="fechaIngreso">Por fecha de ingreso (mitad y mitad)</SelectItem>
                <SelectItem value="manual">Manual (elegir uno por uno)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            {grupos[0].nombreGrupo}: {conteoPorGrupo[0]} alumno(s) — {grupos[1].nombreGrupo}: {conteoPorGrupo[1]} alumno(s)
          </p>

          <div className="max-h-64 overflow-y-auto rounded-md border border-input">
            {matricula.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">Esta matrícula no tiene alumnos todavía.</p>
            )}
            {matricula.map((ac) => (
              <div key={ac.id} className={cn("flex items-center justify-between gap-3 px-3 py-2 text-sm border-b border-border last:border-0")}>
                <span>{ac.alumno?.nombreCompleto ?? ac.alumnoId} — {ac.alumno?.ci ?? ''}</span>
                {criterio === 'manual' ? (
                  <RadioGroup
                    className="flex gap-3"
                    value={String(asignacionManual[ac.alumnoId] ?? 0)}
                    onValueChange={(v) => setAsignacionManual((prev) => ({ ...prev, [ac.alumnoId]: v === '1' ? 1 : 0 }))}
                  >
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <RadioGroupItem value="0" /> {grupos[0].nombreGrupo}
                    </label>
                    <label className="flex items-center gap-1 text-xs cursor-pointer">
                      <RadioGroupItem value="1" /> {grupos[1].nombreGrupo}
                    </label>
                  </RadioGroup>
                ) : (
                  <span className="text-xs text-muted-foreground">{grupos[asignacionEfectiva[ac.alumnoId] ?? 0].nombreGrupo}</span>
                )}
              </div>
            ))}
          </div>

          {error && <FormError>{error}</FormError>}

          {resultado && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <p className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Inscripciones creadas: <span className="font-semibold">{resultado.inscripcionesCreadas}</span> — ya inscritas: {resultado.yaInscritas}</p>
              {resultado.errores.length > 0 && (
                <ul className="list-disc pl-5 text-muted-foreground">
                  {resultado.errores.map((e, i) => (
                    <li key={i}>{alumnoNombre(e.alumnoId)}: {e.motivo}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {resultado ? 'Cerrar' : 'Omitir por ahora'}
          </Button>
          {!resultado && (
            <Button type="button" onClick={handleSubmit} disabled={loading || matricula.length === 0}>
              {loading ? 'Inscribiendo...' : 'Repartir e inscribir'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
