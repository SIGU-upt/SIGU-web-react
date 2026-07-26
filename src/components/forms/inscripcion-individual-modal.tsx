import { useState, useEffect, useMemo } from "react"
import { Search, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { type User, type Clase } from "@/types"
import api from "@/config/api"

interface BatchResult {
  alumnoId: string
  inscripcionesCreadas: number
  yaInscritas: number
  errores: { claseId: string; motivo: string }[]
}

interface InscripcionIndividualModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { alumnoId: string; claseIds: string[] }) => Promise<BatchResult>
  clases: Clase[]
  sedePnfId: string
}

export function InscripcionIndividualModal({
  open,
  onOpenChange,
  onSubmit,
  clases,
  sedePnfId,
}: InscripcionIndividualModalProps) {
  const [alumnos, setAlumnos] = useState<User[]>([])
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedAlumnoIds, setSelectedAlumnoIds] = useState<string[]>([])
  const [selectedClaseIds, setSelectedClaseIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ inscripcionesCreadas: number; yaInscritas: number; errores: string[] } | null>(null)

  useEffect(() => {
    if (!open) return
    setSearch("")
    setDebouncedSearch("")
    setSelectedAlumnoIds([])
    setSelectedClaseIds([])
    setError(null)
    setResultado(null)
  }, [open, sedePnfId])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!open) return
    api.get('/users', { params: { role: 'ALUMNO', sedePnfId, limit: 20, ...(debouncedSearch ? { q: debouncedSearch } : {}) } }).then((res) => {
      const list = res.data.data ?? res.data
      setAlumnos(Array.isArray(list) ? list : [])
    }).catch(() => setAlumnos([]))
  }, [open, sedePnfId, debouncedSearch])

  const gruposPorMateria = useMemo(() => {
    const map = new Map<string, Clase[]>()
    for (const c of clases) {
      map.set(c.ucId, [...(map.get(c.ucId) ?? []), c])
    }
    return Array.from(map.values())
  }, [clases])

  const toggleAlumno = (alumnoId: string) => {
    setSelectedAlumnoIds((prev) => prev.includes(alumnoId) ? prev.filter((id) => id !== alumnoId) : [...prev, alumnoId])
  }

  // Un solo grupo por materia (regla R-1 del backend): al elegir un grupo se
  // descarta cualquier otro grupo ya seleccionado de la misma unidad curricular,
  // evitando el 409 antes de llamar al servidor. Se mantiene Checkbox (no Radio)
  // porque no seleccionar ningún grupo de esa materia es un estado válido.
  const toggleClase = (claseId: string, grupo: Clase[]) => {
    setSelectedClaseIds((prev) => {
      if (prev.includes(claseId)) return prev.filter((id) => id !== claseId)
      if (grupo.length > 1) {
        const siblingIds = grupo.map((c) => c.id)
        return [...prev.filter((id) => !siblingIds.includes(id)), claseId]
      }
      return [...prev, claseId]
    })
  }

  const handleSubmit = async () => {
    if (selectedAlumnoIds.length === 0 || selectedClaseIds.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const resultados = await Promise.all(
        selectedAlumnoIds.map((alumnoId) => onSubmit({ alumnoId, claseIds: selectedClaseIds })),
      )
      const agregado = resultados.reduce((acc, r) => {
        acc.inscripcionesCreadas += r.inscripcionesCreadas
        acc.yaInscritas += r.yaInscritas
        acc.errores.push(...r.errores.map((e) => e.motivo))
        return acc
      }, { inscripcionesCreadas: 0, yaInscritas: 0, errores: [] as string[] })
      setResultado(agregado)
      setSelectedAlumnoIds([])
      setSelectedClaseIds([])
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al inscribir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Inscribir alumnos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Alumnos {selectedAlumnoIds.length > 0 && <span className="text-muted-foreground font-normal">({selectedAlumnoIds.length} seleccionados)</span>}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o cédula..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md border border-input">
              {alumnos.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">No se encontraron alumnos.</p>
              )}
              {alumnos.map((a) => (
                <label key={a.id} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent cursor-pointer">
                  <Checkbox checked={selectedAlumnoIds.includes(a.id)} onCheckedChange={() => toggleAlumno(a.id)} />
                  <span>{a.nombreCompleto} — {a.ci}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Clases</Label>
            <div className="max-h-56 overflow-y-auto rounded-md border border-input p-2 space-y-3">
              {gruposPorMateria.map((grupo) => (
                <div key={grupo[0].ucId}>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {grupo[0].unidadCurricular?.nombre ?? 'Materia'}
                    {grupo.length > 1 && <Badge variant="secondary" className="ml-2">{grupo.length} grupos</Badge>}
                  </p>
                  {grupo.map((c) => (
                    <label key={c.id} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent")}>
                      <Checkbox checked={selectedClaseIds.includes(c.id)} onCheckedChange={() => toggleClase(c.id, grupo)} />
                      <span>{c.nombreGrupo} — {c.docente?.nombreCompleto ?? 'Sin docente'} {c.diaSemana ? `(${c.diaSemana} ${c.horaInicio ?? ''}-${c.horaFin ?? ''})` : ''}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          {resultado && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <p className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Inscripciones creadas: <span className="font-semibold">{resultado.inscripcionesCreadas}</span> — ya inscritas: {resultado.yaInscritas}</p>
              {resultado.errores.length > 0 && (
                <ul className="list-disc pl-5 text-muted-foreground">
                  {resultado.errores.map((motivo, i) => <li key={i}>{motivo}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          <Button type="button" onClick={handleSubmit} disabled={loading || selectedAlumnoIds.length === 0 || selectedClaseIds.length === 0}>
            {loading ? 'Inscribiendo...' : 'Inscribir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
