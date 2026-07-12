import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UCFormData {
  nombre: string
  creditos: number
  trayectoId: string
}

interface UCFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: UCFormData) => Promise<void>
  initialData?: Partial<UCFormData>
  isEditing?: boolean
}

export function UCFormModal({ open, onOpenChange, onSubmit, initialData, isEditing }: UCFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, reset } = useForm<UCFormData>({
    defaultValues: initialData,
  })

  useEffect(() => {
    if (open) { reset(initialData || {}); setError(null) }
  }, [open, initialData, reset])

  const submitHandler = async (data: UCFormData) => {
    setLoading(true)
    setError(null)
    try {
      data.creditos = Number(data.creditos)
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar U.C' : 'Nueva Unidad Curricular'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...register('nombre', { required: 'Requerido' })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="creditos">Créditos</Label>
            <Input id="creditos" type="number" {...register('creditos', { required: 'Requerido', min: 1 })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trayectoId">ID Trayecto</Label>
            <Input id="trayectoId" placeholder="UUID del trayecto" {...register('trayectoId', { required: 'Requerido' })} />
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
