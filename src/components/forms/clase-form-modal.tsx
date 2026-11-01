import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { FormError } from "@/components/ui/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { TimeSlotSelect } from "@/components/ui/time-slot-select"
import { Checkbox } from "@/components/ui/checkbox"
import { type UnidadCurricular, type User, type Turno, Role } from "@/types"
import api from "@/config/api"
import { entityNameRule } from "@/lib/validators"
import { getErrorMessage } from "@/lib/errors"
import { useAuth } from "@/contexts/AuthContext"

const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const

// Días válidos según el turno de la sección: una clase entre semana no puede
// caer en fin de semana y viceversa. Viernes se admite en ambos (algunas
// secciones de fin de semana arrancan ese día).
const DIAS_POR_TURNO: Record<Turno, readonly string[]> = {
  ENTRESEMANA: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'],
  NOCHE: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'],
  FIN_DE_SEMANA: ['VIERNES', 'SABADO', 'DOMINGO'],
}

export interface ClaseFormData {
  ucId: string
  docenteId: string
  nombreGrupo: string
  diaSemana: string
  horaInicio: string
  horaFin: string
  aula: string
}

interface ClaseFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ClaseFormData) => Promise<void>
  trayectoId: string
  sedePnfId: string
  // Acota qué días se pueden elegir (ver DIAS_POR_TURNO). Sin turno definido
  // en la sección, no se restringe nada.
  turno?: Turno | null
  initialData?: Partial<ClaseFormData>
  isEditing?: boolean
  // Para no listar la propia clase editada como "horario ocupado" consigo misma.
  claseId?: string
}

interface ClaseOcupada {
  horaInicio: string
  horaFin: string
}

const DEFAULT_VALUES: ClaseFormData = {
  ucId: '', docenteId: '', nombreGrupo: '', diaSemana: '', horaInicio: '', horaFin: '', aula: '',
}

// El backend devuelve las columnas TIME como "HH:mm:ss" (con segundos). El
// input type="time" no vuelve a normalizarlas si el usuario no lo toca, así
// que al editar sin modificar la hora se reenviaba "19:01:00" y el backend
// lo rechazaba (@Matches exige exactamente HH:mm).
const normalizeTime = (t?: string) => (t ? t.slice(0, 5) : '')

export function ClaseFormModal({
  open,
  onOpenChange,
  onSubmit,
  trayectoId,
  sedePnfId,
  turno,
  initialData,
  isEditing,
  claseId,
}: ClaseFormModalProps) {
  const diasDisponibles = turno ? DIAS_POR_TURNO[turno] : DIAS_SEMANA
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ucOptions, setUcOptions] = useState<UnidadCurricular[]>([])
  const [docenteOptions, setDocenteOptions] = useState<User[]>([])
  const [mostrarOtrosPnf, setMostrarOtrosPnf] = useState(false)
  // El backend fuerza `sedePnfId = currentUser.sedePnfId` en `GET /users` para
  // un COORDINADOR (users.controller.ts), así que para ese rol el toggle no
  // cambiaría nada: solo tiene efecto real para RECTOR (acotado a su sede, no
  // a su PNF) y SUPERADMIN (sin acotar).
  const puedeVerOtrosPnf = user?.role === Role.RECTOR || user?.role === Role.SUPERADMIN
  // Un coordinador no puede listar docentes de otros PNF (ni siquiera de su
  // propia sede), pero sí puede resolver una cédula exacta — el backend tiene
  // una excepción puntual para ese caso (comentario de Vercel en /docentes:
  // "pedir que algún otro docente venga a dar clases a sus pnf").
  const esCoordinador = user?.role === Role.COORDINADOR
  const [cedulaBusqueda, setCedulaBusqueda] = useState("")
  const [buscandoDocente, setBuscandoDocente] = useState(false)
  const [errorBusquedaDocente, setErrorBusquedaDocente] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm<ClaseFormData>({
    defaultValues: { ...DEFAULT_VALUES, ...initialData },
  })
  const horaInicio = watch('horaInicio')
  const diaSemanaElegido = watch('diaSemana')
  const docenteIdElegido = watch('docenteId')
  const aulaElegida = watch('aula')

  // Clases ya agendadas ese día para el docente elegido (y el aula, si se
  // indicó), para no dejar elegir una hora que el backend va a rechazar de
  // todas formas por solapamiento (assertSinSolapamiento en el backend sigue
  // siendo la validación real; esto es solo UX).
  const [ocupados, setOcupados] = useState<ClaseOcupada[]>([])
  useEffect(() => {
    if (!open || !diaSemanaElegido || !docenteIdElegido) {
      setOcupados([])
      return
    }
    let cancelado = false
    const paramsDocente = { diaSemana: diaSemanaElegido, docenteId: docenteIdElegido, limit: 100 }
    const pedidos = [api.get('/clases', { params: paramsDocente })]
    if (aulaElegida) {
      pedidos.push(api.get('/clases', { params: { diaSemana: diaSemanaElegido, aula: aulaElegida, limit: 100 } }))
    }
    Promise.all(pedidos).then((responses) => {
      if (cancelado) return
      const vistos = new Set<string>()
      const lista: ClaseOcupada[] = []
      for (const res of responses) {
        const data = res.data.data ?? res.data
        for (const c of Array.isArray(data) ? data : []) {
          if (c.id === claseId || vistos.has(c.id)) continue
          if (!c.horaInicio || !c.horaFin) continue
          vistos.add(c.id)
          lista.push({ horaInicio: normalizeTime(c.horaInicio), horaFin: normalizeTime(c.horaFin) })
        }
      }
      setOcupados(lista)
    }).catch(() => { if (!cancelado) setOcupados([]) })
    return () => { cancelado = true }
  }, [open, diaSemanaElegido, docenteIdElegido, aulaElegida, claseId])

  const horaInicioOcupada = (hora: string) => ocupados.some((o) => hora >= o.horaInicio && hora < o.horaFin)
  const horaFinOcupada = (hora: string) => {
    if (!horaInicio || hora <= horaInicio) return true
    const proximoChoque = ocupados
      .filter((o) => o.horaInicio >= horaInicio)
      .map((o) => o.horaInicio)
      .sort()[0]
    return proximoChoque ? hora > proximoChoque : false
  }

  useEffect(() => {
    if (open) {
      reset({
        ...DEFAULT_VALUES,
        ...initialData,
        horaInicio: normalizeTime(initialData?.horaInicio),
        horaFin: normalizeTime(initialData?.horaFin),
      })
      setError(null)
      setMostrarOtrosPnf(false)
      setCedulaBusqueda("")
      setErrorBusquedaDocente(null)
    }
  }, [open, initialData, reset])

  const buscarDocentePorCedula = async () => {
    const ci = cedulaBusqueda.trim()
    if (!ci) return
    setBuscandoDocente(true)
    setErrorBusquedaDocente(null)
    try {
      const res = await api.get('/users', { params: { ci, role: 'DOCENTE' } })
      const list = res.data.data ?? res.data
      const encontrado = Array.isArray(list) ? list[0] : undefined
      if (!encontrado) {
        setErrorBusquedaDocente('No se encontró un docente con esa cédula en su sede.')
        return
      }
      setDocenteOptions((prev) => (prev.some((d) => d.id === encontrado.id) ? prev : [...prev, encontrado]))
      setValue('docenteId', encontrado.id, { shouldValidate: true })
    } catch (err) {
      setErrorBusquedaDocente(getErrorMessage(err, 'No se pudo buscar la cédula'))
    } finally {
      setBuscandoDocente(false)
    }
  }

  useEffect(() => {
    if (!open) return
    api.get('/unidades-curriculares', { params: { trayectoId } }).then((res) => {
      const list = res.data.data ?? res.data
      setUcOptions(Array.isArray(list) ? list : [])
    }).catch(() => setUcOptions([]))
    // El docente no está limitado a dictar solo en su propio PNF (Fase 7): la
    // pertenencia a un sedePnfId es administrativa, no una restricción real. Con
    // el toggle activo se omite el filtro para traer docentes de otros PNF.
    const params = mostrarOtrosPnf && puedeVerOtrosPnf
      ? { role: 'DOCENTE', limit: 200 }
      : { role: 'DOCENTE', sedePnfId, limit: 200 }
    api.get('/users', { params }).then((res) => {
      const list = res.data.data ?? res.data
      const docentes = Array.isArray(list) ? list : []
      docentes.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto))
      setDocenteOptions(docentes)
    }).catch(() => setDocenteOptions([]))
  }, [open, trayectoId, sedePnfId, mostrarOtrosPnf, puedeVerOtrosPnf])

  const submitHandler = async (data: ClaseFormData) => {
    setLoading(true)
    setError(null)
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Clase' : 'Agregar Clase'}</DialogTitle>
          <DialogDescription className="sr-only">Datos de la clase: materia, docente, grupo y horario.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ucId">Materia</Label>
            <Controller
              control={control}
              name="ucId"
              rules={{ required: 'Requerido' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="ucId" className="w-full">
                    <SelectValue placeholder="Seleccione una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {ucOptions.map((uc) => (
                      <SelectItem key={uc.id} value={uc.id}>{uc.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.ucId && <p className="text-xs text-destructive">{errors.ucId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="docenteId">Docente</Label>
            {puedeVerOtrosPnf && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="mostrarOtrosPnf"
                  checked={mostrarOtrosPnf}
                  onCheckedChange={(checked) => setMostrarOtrosPnf(checked === true)}
                />
                <Label htmlFor="mostrarOtrosPnf" className="text-xs font-normal text-muted-foreground">
                  Mostrar docentes de otros PNF
                </Label>
              </div>
            )}
            {esCoordinador && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Cédula de un docente de otro PNF de su sede"
                    value={cedulaBusqueda}
                    onChange={(e) => setCedulaBusqueda(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={buscarDocentePorCedula} disabled={buscandoDocente || !cedulaBusqueda.trim()}>
                    {buscandoDocente ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>
                {errorBusquedaDocente && <p className="text-xs text-destructive">{errorBusquedaDocente}</p>}
              </div>
            )}
            <Controller
              control={control}
              name="docenteId"
              rules={{ required: 'Requerido' }}
              render={({ field }) => (
                <SearchableSelect
                  id="docenteId"
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Seleccione un docente"
                  searchPlaceholder="Buscar docente..."
                  options={docenteOptions.map((d) => ({
                    value: d.id,
                    label: `${d.nombreCompleto} — ${d.ci}${d.sedePnfId !== sedePnfId ? ' (otro PNF)' : ''}`,
                  }))}
                />
              )}
            />
            {errors.docenteId && <p className="text-xs text-destructive">{errors.docenteId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombreGrupo">Nombre de grupo</Label>
            <Input id="nombreGrupo" placeholder="Grupo A" {...register('nombreGrupo', { ...entityNameRule, maxLength: { value: 50, message: 'Máximo 50 caracteres' } })} />
            {errors.nombreGrupo && <p className="text-xs text-destructive">{errors.nombreGrupo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="diaSemana">Día de la semana</Label>
            <Controller
              control={control}
              name="diaSemana"
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger id="diaSemana" className="w-full">
                    <SelectValue placeholder="Sin definir" />
                  </SelectTrigger>
                  <SelectContent>
                    {diasDisponibles.map((d) => (
                      <SelectItem key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Hora inicio</Label>
              <Controller
                control={control}
                name="horaInicio"
                render={({ field }) => (
                  <TimeSlotSelect
                    id="horaInicio"
                    value={field.value}
                    onChange={field.onChange}
                    disabledTimes={horaInicioOcupada}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFin">Hora fin</Label>
              <Controller
                control={control}
                name="horaFin"
                rules={{
                  validate: (value) =>
                    !value || !horaInicio || value > horaInicio || 'Debe ser posterior a la hora de inicio',
                }}
                render={({ field }) => (
                  <TimeSlotSelect
                    id="horaFin"
                    value={field.value}
                    onChange={field.onChange}
                    disabledTimes={horaFinOcupada}
                  />
                )}
              />
              {errors.horaFin && <p className="text-xs text-destructive">{errors.horaFin.message}</p>}
            </div>
          </div>
          {ocupados.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Horarios ocupados este día: {ocupados.map((o) => `${o.horaInicio}–${o.horaFin}`).join(', ')}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="aula">Aula (opcional)</Label>
            <p className="text-xs text-muted-foreground">Si se indica, no puede coincidir con otra clase en el mismo horario.</p>
            <Input id="aula" placeholder="A-101" {...register('aula', { maxLength: { value: 50, message: 'Máximo 50 caracteres' }, pattern: entityNameRule.pattern, setValueAs: (value: unknown) => (typeof value === 'string' ? value.trim() : value) })} />
            {errors.aula && <p className="text-xs text-destructive">{errors.aula.message}</p>}
          </div>

          {error && <FormError>{error}</FormError>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Agregar Clase'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
