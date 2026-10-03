import { useState, useEffect } from "react"
import { CalendarClock, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Role, type SedePnf, type Trayecto, type AlumnoCohorte } from "@/types"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/config/api"

interface AsistenteCierrePeriodoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: () => void
}

interface PromoverResult {
  promovidos: number
  rechazados: { alumnoId: string; motivo: string }[]
  inscripcionesHuerfanas: { alumnoId: string; claseId: string; unidadCurricular: string }[]
}

type Step = 1 | 2 | 3

export function AsistenteCierrePeriodoModal({ open, onOpenChange, onDone }: AsistenteCierrePeriodoModalProps) {
  const { user: currentUser } = useAuth()
  const isCoordinador = currentUser?.role === Role.COORDINADOR
  const isRector = currentUser?.role === Role.RECTOR
  const isSuperadmin = currentUser?.role === Role.SUPERADMIN

  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sedePnfOptions, setSedePnfOptions] = useState<SedePnf[]>([])
  const [selectedSedeId, setSelectedSedeId] = useState("")
  const [sedePnfId, setSedePnfId] = useState("")
  const [trayectoOptions, setTrayectoOptions] = useState<Trayecto[]>([])
  const [trayectoOrigenId, setTrayectoOrigenId] = useState("")
  const [trayectoDestinoId, setTrayectoDestinoId] = useState("")

  const [nombrePeriodo, setNombrePeriodo] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")

  const [alumnosAfectados, setAlumnosAfectados] = useState<AlumnoCohorte[]>([])
  const [loadingAfectados, setLoadingAfectados] = useState(false)

  const [resultado, setResultado] = useState<PromoverResult | null>(null)

  useEffect(() => {
    if (!open) return
    setStep(1)
    setError(null)
    setResultado(null)
    setNombrePeriodo("")
    setFechaInicio("")
    setFechaFin("")
    setTrayectoOrigenId("")
    setTrayectoDestinoId("")
    setSedePnfId(isCoordinador && currentUser?.sedePnfId ? currentUser.sedePnfId : "")
    setSelectedSedeId(isRector && currentUser?.sedeActualId ? currentUser.sedeActualId : "")
  }, [open, isCoordinador, isRector, currentUser])

  useEffect(() => {
    if (!open) return
    api.get('/sede-pnf').then((res) => {
      const list = res.data.data ?? res.data
      setSedePnfOptions(Array.isArray(list) ? list : [])
    }).catch(() => setSedePnfOptions([]))
  }, [open])

  const sedeOptions = Array.from(
    new Map(sedePnfOptions.map((sp) => [sp.sedeId, sp.sede?.nombre ?? sp.sedeId])).entries(),
  ).map(([id, label]) => ({ id, label }))
  const pnfOptionsForSede = sedePnfOptions.filter((sp) => sp.sedeId === selectedSedeId)

  useEffect(() => {
    if (!sedePnfId) { setTrayectoOptions([]); return }
    const pnfId = sedePnfOptions.find((sp) => sp.id === sedePnfId)?.pnfId
    if (!pnfId) return
    api.get('/trayectos', { params: { pnfId } }).then((res) => {
      const list = res.data.data ?? res.data
      setTrayectoOptions(Array.isArray(list) ? list.sort((a: Trayecto, b: Trayecto) => a.numero - b.numero) : [])
    }).catch(() => setTrayectoOptions([]))
  }, [sedePnfId, sedePnfOptions])

  // Al elegir el trayecto de origen, sugerir automáticamente el siguiente
  // trayecto numérico como destino — es el caso de uso normal (promoción de
  // fin de trayecto); el coordinador puede cambiarlo si necesita otra cosa.
  useEffect(() => {
    if (!trayectoOrigenId) return
    const origen = trayectoOptions.find((t) => t.id === trayectoOrigenId)
    if (!origen) return
    const siguiente = trayectoOptions.find((t) => t.numero === origen.numero + 1)
    if (siguiente) setTrayectoDestinoId(siguiente.id)
  }, [trayectoOrigenId, trayectoOptions])

  const puedeAvanzarPaso1 =
    !!sedePnfId && !!trayectoOrigenId && !!trayectoDestinoId && trayectoOrigenId !== trayectoDestinoId &&
    !!nombrePeriodo.trim() && !!fechaInicio && !!fechaFin && fechaFin > fechaInicio

  const irAConfirmar = async () => {
    setError(null)
    setLoadingAfectados(true)
    setStep(2)
    try {
      const res = await api.get('/cohortes', {
        params: { sedePnfId, trayectoId: trayectoOrigenId, activa: true, limit: 200 },
      })
      const list = res.data.data ?? res.data
      setAlumnosAfectados(Array.isArray(list) ? list : [])
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'No se pudo calcular el impacto')
      setAlumnosAfectados([])
    } finally {
      setLoadingAfectados(false)
    }
  }

  const ejecutar = async () => {
    setLoading(true)
    setError(null)
    try {
      const periodoRes = await api.post('/periodos', {
        nombre: nombrePeriodo.trim(),
        fechaInicio,
        fechaFin,
        sedePnfId,
        activo: true,
      })
      const nuevoPeriodoId = periodoRes.data.id

      if (alumnosAfectados.length > 0) {
        const promoverRes = await api.post('/cohortes/promover', {
          alumnoIds: alumnosAfectados.map((a) => a.alumnoId),
          trayectoIdDestino: trayectoDestinoId,
          periodoId: nuevoPeriodoId,
        })
        setResultado(promoverRes.data)
      } else {
        setResultado({ promovidos: 0, rechazados: [], inscripcionesHuerfanas: [] })
      }
      setStep(3)
      onDone()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'No se pudo completar el cierre de período')
    } finally {
      setLoading(false)
    }
  }

  const trayectoOrigenNombre = trayectoOptions.find((t) => t.id === trayectoOrigenId)?.nombre
  const trayectoDestinoNombre = trayectoOptions.find((t) => t.id === trayectoDestinoId)?.nombre
  const sedePnfLabel = sedePnfOptions.find((sp) => sp.id === sedePnfId)
  const sedePnfLabelText = sedePnfLabel ? `${sedePnfLabel.sede?.nombre ?? '—'} · ${sedePnfLabel.pnf?.nombre ?? '—'}` : '—'

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Asistente de Cierre de Período
          </DialogTitle>
          <DialogDescription>
            Paso {step} de 3 — {step === 1 ? 'datos del nuevo período' : step === 2 ? 'confirmar impacto' : 'resultado'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            {isSuperadmin && (
              <div className="space-y-2">
                <Label htmlFor="sedeId">Sede</Label>
                <Select value={selectedSedeId} onValueChange={(v) => { setSelectedSedeId(v); setSedePnfId(""); setTrayectoOrigenId(""); setTrayectoDestinoId("") }}>
                  <SelectTrigger id="sedeId" className="w-full">
                    <SelectValue placeholder="Seleccione una sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {sedeOptions.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(isSuperadmin || isRector) && (
              <div className="space-y-2">
                <Label htmlFor="sedePnfId">PNF</Label>
                <Select value={sedePnfId} onValueChange={(v) => { setSedePnfId(v); setTrayectoOrigenId(""); setTrayectoDestinoId("") }} disabled={isSuperadmin && !selectedSedeId}>
                  <SelectTrigger id="sedePnfId" className="w-full">
                    <SelectValue placeholder={isSuperadmin && !selectedSedeId ? "Elija primero una sede" : "Seleccione un PNF"} />
                  </SelectTrigger>
                  <SelectContent>
                    {pnfOptionsForSede.map((sp) => <SelectItem key={sp.id} value={sp.id}>{sp.pnf?.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trayectoOrigenId">Trayecto a promover</Label>
                <Select value={trayectoOrigenId} onValueChange={setTrayectoOrigenId} disabled={!sedePnfId}>
                  <SelectTrigger id="trayectoOrigenId" className="w-full">
                    <SelectValue placeholder={sedePnfId ? "Trayecto actual" : "Elija primero un PNF"} />
                  </SelectTrigger>
                  <SelectContent>
                    {trayectoOptions.map((t) => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trayectoDestinoId">Trayecto destino</Label>
                <Select value={trayectoDestinoId} onValueChange={setTrayectoDestinoId} disabled={!sedePnfId}>
                  <SelectTrigger id="trayectoDestinoId" className="w-full">
                    <SelectValue placeholder="Trayecto siguiente" />
                  </SelectTrigger>
                  <SelectContent>
                    {trayectoOptions.map((t) => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombrePeriodo">Nombre del nuevo período</Label>
              <Input id="nombrePeriodo" placeholder="2026-II" value={nombrePeriodo} onChange={(e) => setNombrePeriodo(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha de inicio</Label>
                <Input id="fechaInicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFin">Fecha de fin</Label>
                <Input id="fechaFin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              </div>
            </div>
            {fechaFin && fechaInicio && fechaFin <= fechaInicio && (
              <p className="text-xs text-destructive">La fecha de fin debe ser posterior a la de inicio</p>
            )}

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="button" onClick={irAConfirmar} disabled={!puedeAvanzarPaso1}>
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-2 text-sm">
              <p>Se creará el período <span className="font-medium">{nombrePeriodo}</span> ({fechaInicio} a {fechaFin}) para <span className="font-medium">{sedePnfLabelText}</span>.</p>
              <p>
                Se promoverán los alumnos con cohorte activa en{' '}
                <span className="font-medium">{trayectoOrigenNombre}</span> hacia{' '}
                <span className="font-medium">{trayectoDestinoNombre}</span>, matriculándolos en el período nuevo.
              </p>
            </div>

            {loadingAfectados ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Calculando alumnos afectados...</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{alumnosAfectados.length} alumno{alumnosAfectados.length === 1 ? '' : 's'}</Badge>
                  <span className="text-sm text-muted-foreground">con cohorte activa en este trayecto</span>
                </div>
                {alumnosAfectados.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay ningún alumno con cohorte activa en este trayecto — el período se creará igual, pero no habrá nada que promover.
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-md border p-2 text-sm text-muted-foreground">
                    {alumnosAfectados.slice(0, 20).map((a) => (
                      <div key={a.id}>{a.alumno?.nombreCompleto ?? a.alumnoId}</div>
                    ))}
                    {alumnosAfectados.length > 20 && <div>y {alumnosAfectados.length - 20} más...</div>}
                  </div>
                )}
              </div>
            )}

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={loading}>Atrás</Button>
              <Button type="button" onClick={ejecutar} disabled={loading || loadingAfectados}>
                {loading ? 'Procesando...' : 'Confirmar y cerrar período'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && resultado && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Período <span className="font-medium">{nombrePeriodo}</span> creado. {resultado.promovidos} alumno{resultado.promovidos === 1 ? '' : 's'} promovido{resultado.promovidos === 1 ? '' : 's'} a {trayectoDestinoNombre}.
            </div>

            {resultado.rechazados.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4" /> {resultado.rechazados.length} no se pudieron promover
                </div>
                <div className="max-h-32 overflow-y-auto rounded-md border p-2 text-sm text-muted-foreground">
                  {resultado.rechazados.map((r, i) => (
                    <div key={i}>{r.alumnoId}: {r.motivo}</div>
                  ))}
                </div>
              </div>
            )}

            {resultado.inscripcionesHuerfanas.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
                  <AlertTriangle className="h-4 w-4" /> {resultado.inscripcionesHuerfanas.length} inscripciones del trayecto anterior quedaron sin sentido
                </div>
                <p className="text-xs text-muted-foreground">
                  Estos alumnos siguen inscritos en materias de su trayecto anterior — revíselas en Secciones y desinscríbalas si corresponde.
                </p>
                <div className="max-h-32 overflow-y-auto rounded-md border p-2 text-sm text-muted-foreground">
                  {resultado.inscripcionesHuerfanas.map((h, i) => (
                    <div key={i}>{h.unidadCurricular}</div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
