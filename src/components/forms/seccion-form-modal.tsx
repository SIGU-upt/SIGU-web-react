import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type SedePnf, type Trayecto } from "@/types"
import api from "@/config/api"
import { requiredTextRule } from "@/lib/validators"

interface SeccionFormData {
  sedePnfId: string
  trayectoId: string
  codigo: string
}

interface SeccionFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: SeccionFormData) => Promise<void>
  initialData?: Partial<SeccionFormData>
  isEditing?: boolean
}

export function SeccionFormModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing,
}: SeccionFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sedePnfOptions, setSedePnfOptions] = useState<SedePnf[]>([])
  const [trayectoOptions, setTrayectoOptions] = useState<Trayecto[]>([])

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<SeccionFormData>({
    defaultValues: { sedePnfId: '', trayectoId: '', codigo: '', ...initialData },
  })
  const sedePnfId = watch('sedePnfId')

  useEffect(() => {
    if (open) {
      reset({ sedePnfId: '', trayectoId: '', codigo: '', ...initialData })
      setError(null)
    }
  }, [open, initialData, reset])

  useEffect(() => {
    if (open) {
      api.get('/sede-pnf').then((res) => {
        const list = res.data.data ?? res.data
        setSedePnfOptions(Array.isArray(list) ? list : [])
      }).catch(() => setSedePnfOptions([]))
    }
  }, [open])

  useEffect(() => {
    if (!sedePnfId) {
      setTrayectoOptions([])
      return
    }
    const pnfId = sedePnfOptions.find((sp) => sp.id === sedePnfId)?.pnfId
    if (!pnfId) {
      setTrayectoOptions([])
      return
    }
    api.get('/trayectos', { params: { pnfId } }).then((res) => {
      const list = res.data.data ?? res.data
      setTrayectoOptions(Array.isArray(list) ? list : [])
    }).catch(() => setTrayectoOptions([]))
  }, [sedePnfId, sedePnfOptions])

  const submitHandler = async (data: SeccionFormData) => {
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
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Sección' : 'Nueva Sección'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sedePnfId">Sede-PNF</Label>
            <Controller
              control={control}
              name="sedePnfId"
              rules={{ required: 'Requerido' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => { field.onChange(v); setValue('trayectoId', '') }}>
                  <SelectTrigger id="sedePnfId" className="w-full">
                    <SelectValue placeholder="Seleccione una sede-PNF" />
                  </SelectTrigger>
                  <SelectContent>
                    {sedePnfOptions.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.pnf?.nombre} — {sp.sede?.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.sedePnfId && <p className="text-xs text-destructive">{errors.sedePnfId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="trayectoId">Trayecto</Label>
            <Controller
              control={control}
              name="trayectoId"
              rules={{ required: 'Requerido' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!sedePnfId}>
                  <SelectTrigger id="trayectoId" className="w-full">
                    <SelectValue placeholder={sedePnfId ? "Seleccione un trayecto" : "Elija primero una sede-PNF"} />
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
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" placeholder="IN21" {...register('codigo', { ...requiredTextRule, maxLength: { value: 20, message: 'Máximo 20 caracteres' } })} />
            {errors.codigo && <p className="text-xs text-destructive">{errors.codigo.message}</p>}
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Sección'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
