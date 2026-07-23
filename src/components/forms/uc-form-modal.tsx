import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Trayecto, type Tramo } from "@/types"
import api from "@/config/api"
import { requiredTextRule } from "@/lib/validators"

interface UCFormData {
  nombre: string
  trayectoId: string
  tramoId?: string
}

interface UCFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: UCFormData) => Promise<void>
  initialData?: Partial<UCFormData>
  isEditing?: boolean
}

const SIN_TRAMO = "__anual__"

export function UCFormModal({ open, onOpenChange, onSubmit, initialData, isEditing }: UCFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trayectoOptions, setTrayectoOptions] = useState<Trayecto[]>([])
  const [tramoOptions, setTramoOptions] = useState<Tramo[]>([])

  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm<UCFormData>({
    defaultValues: { nombre: '', trayectoId: '', tramoId: SIN_TRAMO, ...initialData },
  })
  const trayectoId = watch('trayectoId')

  useEffect(() => {
    if (open) {
      reset({ nombre: '', trayectoId: '', tramoId: SIN_TRAMO, ...initialData })
      setError(null)
    }
  }, [open, initialData, reset])

  useEffect(() => {
    if (!open) return
    api.get('/trayectos').then((res) => {
      const list = res.data.data ?? res.data
      setTrayectoOptions(Array.isArray(list) ? list : [])
    }).catch(() => setTrayectoOptions([]))
  }, [open])

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

  const submitHandler = async (data: UCFormData) => {
    setLoading(true)
    setError(null)
    try {
      await onSubmit({ ...data, tramoId: data.tramoId === SIN_TRAMO ? undefined : data.tramoId })
      onOpenChange(false)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar U.C' : 'Nueva Unidad Curricular'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...register('nombre', requiredTextRule)} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="trayectoId">Trayecto</Label>
            <Controller
              control={control}
              name="trayectoId"
              rules={{ required: 'Requerido' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="trayectoId" className="w-full">
                    <SelectValue placeholder="Seleccione un trayecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {trayectoOptions.map((t) => (
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
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear U.C'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
