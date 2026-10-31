import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { FormError } from "@/components/ui/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Role, type Trayecto, type Tramo, type SedePnf } from "@/types"
import api from "@/config/api"
import { opcionesDeSede } from "@/lib/opciones-sede"
import { useAuth } from "@/contexts/AuthContext"
import { entityNameRule } from "@/lib/validators"
import { getErrorMessage } from "@/lib/errors"

interface UCFormData {
  nombre: string
  trayectoId: string
  tramoId?: string
  tipo?: 'REGULAR' | 'PRACTICA_PROFESIONAL'
  // Si se eligió una materia ya existente del catálogo (ver buscador debajo
  // de Nombre), se manda esto en vez de nombre/tipo — así dos coordinadores
  // de sedes distintas no terminan creando dos entradas para "Matemática I".
  ucCatalogoIdSeleccionado?: string
}

interface CatalogoMatch {
  id: string
  nombre: string
  codigo: string
}

interface UCFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: UCFormData) => Promise<void>
  initialData?: Partial<UCFormData>
  isEditing?: boolean
  // ADR-023: para avisar en cuántos trayectos se dicta la materia antes de renombrarla.
  ucCatalogoId?: string
}

const SIN_TRAMO = "__anual__"

export function UCFormModal({ open, onOpenChange, onSubmit, initialData, isEditing, ucCatalogoId }: UCFormModalProps) {
  const { user: currentUser } = useAuth()
  // Un coordinador solo gestiona un PNF propio: elegir sede y PNF no tiene
  // ninguna decisión real que tomar, solo sirve para llegar al trayecto
  // (comentario de Vercel en /unidades).
  const esCoordinador = currentUser?.role === Role.COORDINADOR
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trayectoOptions, setTrayectoOptions] = useState<Trayecto[]>([])
  const [tramoOptions, setTramoOptions] = useState<Tramo[]>([])
  const [ofertasCount, setOfertasCount] = useState<number | null>(null)
  const [sedePnfOptions, setSedePnfOptions] = useState<SedePnf[]>([])
  const [selectedSedeId, setSelectedSedeId] = useState("")
  const [selectedPnfId, setSelectedPnfId] = useState("")
  const [catalogoMatches, setCatalogoMatches] = useState<CatalogoMatch[]>([])
  const [catalogoSeleccionado, setCatalogoSeleccionado] = useState<CatalogoMatch | null>(null)

  const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm<UCFormData>({
    defaultValues: { nombre: '', trayectoId: '', tramoId: SIN_TRAMO, tipo: 'REGULAR', ...initialData },
  })
  const trayectoId = watch('trayectoId')
  const nombreValue = watch('nombre')

  useEffect(() => {
    if (open) {
      reset({ nombre: '', trayectoId: '', tramoId: SIN_TRAMO, tipo: 'REGULAR', ...initialData })
      setSelectedSedeId("")
      setSelectedPnfId("")
      setCatalogoMatches([])
      setCatalogoSeleccionado(null)
      setError(null)
    }
  }, [open, initialData, reset])

  // Busca en el catálogo compartido (ADR-023) mientras se escribe el nombre,
  // para ofrecer reusar una materia ya existente en vez de crear un duplicado
  // con otro código — dos coordinadores de sedes distintas creando "Matemática
  // I" por separado hoy generan dos entradas de catálogo sin relación entre sí
  // (comentario de Vercel en /unidades).
  useEffect(() => {
    if (!open || isEditing || catalogoSeleccionado) {
      setCatalogoMatches([])
      return
    }
    const termino = nombreValue?.trim()
    if (!termino || termino.length < 3) {
      setCatalogoMatches([])
      return
    }
    const timer = setTimeout(() => {
      api.get('/uc-catalogo', { params: { q: termino, limit: 5 } }).then((res) => {
        const list = res.data.data ?? res.data
        setCatalogoMatches(Array.isArray(list) ? list : [])
      }).catch(() => setCatalogoMatches([]))
    }, 300)
    return () => clearTimeout(timer)
  }, [open, isEditing, nombreValue, catalogoSeleccionado])

  const elegirCatalogo = (match: CatalogoMatch) => {
    setCatalogoSeleccionado(match)
    setValue('nombre', match.nombre)
    setCatalogoMatches([])
  }
  const descartarCatalogo = () => {
    setCatalogoSeleccionado(null)
    setValue('nombre', '')
  }

  useEffect(() => {
    if (!open) return
    api.get('/trayectos').then((res) => {
      const list = res.data.data ?? res.data
      setTrayectoOptions(Array.isArray(list) ? list : [])
    }).catch(() => setTrayectoOptions([]))
    api.get('/sede-pnf', { params: { limit: 200 } }).then((res) => {
      const list = res.data.data ?? res.data
      setSedePnfOptions(Array.isArray(list) ? list : [])
    }).catch(() => setSedePnfOptions([]))
  }, [open])

  // Al editar, deriva sede y PNF a partir del trayecto ya guardado, una vez que
  // las opciones cargaron, para que el select de trayecto arranque filtrado.
  useEffect(() => {
    if (!open || !initialData?.trayectoId || trayectoOptions.length === 0) return
    const t = trayectoOptions.find((tr) => tr.id === initialData.trayectoId)
    if (!t) return
    setSelectedPnfId(t.pnfId)
    const sp = sedePnfOptions.find((s) => s.pnfId === t.pnfId)
    if (sp) setSelectedSedeId(sp.sedeId)
  }, [open, initialData?.trayectoId, trayectoOptions, sedePnfOptions])

  // Para un coordinador, "su PNF" es la única opción posible: se preselecciona
  // directo (igual que ya editando) en vez de obligarlo a elegir sede y PNF.
  useEffect(() => {
    if (!open || !esCoordinador || initialData?.trayectoId || sedePnfOptions.length === 0) return
    const propia = sedePnfOptions[0]
    setSelectedSedeId(propia.sedeId)
    setSelectedPnfId(propia.pnfId)
  }, [open, esCoordinador, initialData?.trayectoId, sedePnfOptions])

  useEffect(() => {
    if (!open || !isEditing || !ucCatalogoId) {
      setOfertasCount(null)
      return
    }
    api.get(`/uc-catalogo/${ucCatalogoId}/ofertas`).then((res) => {
      const list = res.data.data ?? res.data
      setOfertasCount(Array.isArray(list) ? list.length : null)
    }).catch(() => setOfertasCount(null))
  }, [open, isEditing, ucCatalogoId])

  useEffect(() => {
    if (!trayectoId) {
      setTramoOptions([])
      return
    }
    api.get('/tramos', { params: { trayectoId } }).then((res) => {
      const list = res.data.data ?? res.data
      setTramoOptions(Array.isArray(list) ? list : [])
    }).catch(() => setTramoOptions([]))
  }, [trayectoId])

  // Sede → PNF → Trayecto: Trayecto.pnfId es la única relación real del modelo
  // (un trayecto no pertenece a una sede), así que el trayecto siempre se filtra
  // por PNF; la sede es solo un filtro opcional para acotar la lista de PNF.
  // Evita la ambigüedad de "Trayecto 1" repetido entre PNF distintos.
  const sedeOptions = opcionesDeSede(sedePnfOptions)
  const pnfOptions = Array.from(
    new Map(
      sedePnfOptions
        .filter((sp) => !selectedSedeId || sp.sedeId === selectedSedeId)
        .map((sp) => [sp.pnfId, sp.pnf?.nombre ?? sp.pnfId]),
    ).entries(),
  ).map(([id, label]) => ({ id, label }))
  const visibleTrayectoOptions = selectedPnfId
    ? trayectoOptions.filter((t) => t.pnfId === selectedPnfId)
    : []

  const handleSedeChange = (value: string) => {
    setSelectedSedeId(value)
    setSelectedPnfId("")
    setValue('trayectoId', '')
  }
  const handlePnfChange = (value: string) => {
    setSelectedPnfId(value)
    setValue('trayectoId', '')
  }

  const submitHandler = async (data: UCFormData) => {
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        ...data,
        tramoId: data.tramoId === SIN_TRAMO ? undefined : data.tramoId,
        ucCatalogoIdSeleccionado: catalogoSeleccionado?.id,
      })
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar U.C' : 'Nueva Unidad Curricular'}</DialogTitle>
          <DialogDescription className="sr-only">Datos de la unidad curricular.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...register('nombre', entityNameRule)} disabled={!!catalogoSeleccionado} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
            {isEditing && ofertasCount != null && ofertasCount > 1 && (
              <p className="text-xs text-muted-foreground">Esta materia se dicta en {ofertasCount} trayectos; el cambio de nombre aplicará a todos.</p>
            )}
            {catalogoSeleccionado ? (
              <p className="text-xs text-muted-foreground">
                Usando la materia ya existente del catálogo ({catalogoSeleccionado.codigo}).{' '}
                <button type="button" className="underline" onClick={descartarCatalogo}>Crear una nueva en su lugar</button>
              </p>
            ) : catalogoMatches.length > 0 && (
              <div className="rounded-md border border-border bg-popover text-sm shadow-sm">
                <p className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
                  Ya existe en el catálogo — use la misma en vez de crear otra:
                </p>
                {catalogoMatches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="block w-full px-3 py-1.5 text-left hover:bg-muted/70"
                    onClick={() => elegirCatalogo(m)}
                  >
                    {m.nombre} <span className="text-xs text-muted-foreground">({m.codigo})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {!esCoordinador && (
            <>
              <div className="space-y-2">
                <Label htmlFor="sedeId">Sede (opcional, para acotar el PNF)</Label>
                <Select value={selectedSedeId || "__all__"} onValueChange={(v) => handleSedeChange(v === "__all__" ? "" : v)}>
                  <SelectTrigger id="sedeId" className="w-full">
                    <SelectValue placeholder="Todas las sedes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las sedes</SelectItem>
                    {sedeOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pnfId">PNF</Label>
                <Select value={selectedPnfId} onValueChange={handlePnfChange}>
                  <SelectTrigger id="pnfId" className="w-full">
                    <SelectValue placeholder="Seleccione un PNF" />
                  </SelectTrigger>
                  <SelectContent>
                    {pnfOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="trayectoId">Trayecto</Label>
            <Controller
              control={control}
              name="trayectoId"
              rules={{ required: 'Requerido' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!selectedPnfId}>
                  <SelectTrigger id="trayectoId" className="w-full">
                    <SelectValue placeholder={selectedPnfId ? "Seleccione un trayecto" : "Elija primero un PNF"} />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleTrayectoOptions.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.trayectoId && <p className="text-xs text-destructive">{errors.trayectoId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tramoId">Tramo (solo si es una materia trimestral)</Label>
            <p className="text-xs text-muted-foreground">Deje "Anual" si la materia se cursa durante todo el trayecto.</p>
            <Controller
              control={control}
              name="tramoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!trayectoId}>
                  <SelectTrigger id="tramoId" className="w-full">
                    <SelectValue placeholder={trayectoId ? "Anual" : "Elija primero un trayecto"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_TRAMO}>Anual (todo el trayecto)</SelectItem>
                    {tramoOptions.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.isPer ? 'PER' : `Tramo ${t.numero}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <p className="text-xs text-muted-foreground">
              La Práctica Profesional exige 80% de asistencia mínima (Art. 24b del reglamento), no el 75% general.
            </p>
            <Controller
              control={control}
              name="tipo"
              render={({ field }) => (
                <Select value={field.value ?? 'REGULAR'} onValueChange={field.onChange}>
                  <SelectTrigger id="tipo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGULAR">Regular (75% de asistencia)</SelectItem>
                    <SelectItem value="PRACTICA_PROFESIONAL">Práctica Profesional (80% de asistencia)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {error && <FormError>{error}</FormError>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear U.C'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
