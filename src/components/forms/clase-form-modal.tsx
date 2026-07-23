import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type UnidadCurricular, type User } from "@/types"
import api from "@/config/api"
import { requiredTextRule } from "@/lib/validators"

const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'] as const

interface ClaseFormData {
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
  initialData?: Partial<ClaseFormData>
  isEditing?: boolean
}

export function ClaseFormModal({
  open,
  onOpenChange,
  onSubmit,
  trayectoId,
  sedePnfId,
  initialData,
  isEditing,
}: ClaseFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ucOptions, setUcOptions] = useState<UnidadCurricular[]>([])
  const [docenteOptions, setDocenteOptions] = useState<User[]>([])

  const defaultValues: ClaseFormData = {
    ucId: '', docenteId: '', nombreGrupo: '', diaSemana: '', horaInicio: '', horaFin: '', aula: '',
  }

  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm<ClaseFormData>({
    defaultValues: { ...defaultValues, ...initialData },
  })
  const horaInicio = watch('horaInicio')

  useEffect(() => {
    if (open) {
      reset({ ...defaultValues, ...initialData })
      setError(null)
    }
  }, [open, initialData, reset])

  useEffect(() => {
    if (!open) return
    api.get('/unidades-curriculares', { params: { trayectoId } }).then((res) => {
      const list = res.data.data ?? res.data
      setUcOptions(Array.isArray(list) ? list : [])
    }).catch(() => setUcOptions([]))
    api.get('/users', { params: { role: 'DOCENTE', sedePnfId, limit: 1000 } }).then((res) => {
      const list = res.data.data ?? res.data
      setDocenteOptions(Array.isArray(list) ? list : [])
    }).catch(() => setDocenteOptions([]))
  }, [open, trayectoId, sedePnfId])

  const submitHandler = async (data: ClaseFormData) => {
    setLoading(true)
    setError(null)
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Clase' : 'Agregar Clase'}</DialogTitle>
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
            <Controller
              control={control}
              name="docenteId"
              rules={{ required: 'Requerido' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="docenteId" className="w-full">
                    <SelectValue placeholder="Seleccione un docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {docenteOptions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.nombreCompleto} — {d.ci}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.docenteId && <p className="text-xs text-destructive">{errors.docenteId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombreGrupo">Nombre de grupo</Label>
            <Input id="nombreGrupo" placeholder="Grupo A" {...register('nombreGrupo', { ...requiredTextRule, maxLength: { value: 50, message: 'Máximo 50 caracteres' } })} />
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
                    {DIAS_SEMANA.map((d) => (
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
              <Input id="horaInicio" type="time" {...register('horaInicio')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFin">Hora fin</Label>
              <Input
                id="horaFin"
                type="time"
                {...register('horaFin', {
                  validate: (value) =>
                    !value || !horaInicio || value > horaInicio || 'Debe ser posterior a la hora de inicio',
                })}
              />
              {errors.horaFin && <p className="text-xs text-destructive">{errors.horaFin.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aula">Aula</Label>
            <Input id="aula" placeholder="A-101" {...register('aula', { maxLength: { value: 50, message: 'Máximo 50 caracteres' } })} />
            {errors.aula && <p className="text-xs text-destructive">{errors.aula.message}</p>}
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

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
