import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export interface EntityField {
  name: string
  label: string
  type?: 'text' | 'number' | 'checkbox'
  required?: boolean
}

interface EntityFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Record<string, any>) => Promise<void>
  title: string
  fields: EntityField[]
  initialData?: Record<string, any>
  isEditing?: boolean
}

export function EntityFormModal({
  open, onOpenChange, onSubmit, title, fields,
  initialData, isEditing,
}: EntityFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultValues = fields.reduce((acc, f) => {
    acc[f.name] = initialData?.[f.name] ?? (f.type === 'checkbox' ? false : '')
    return acc
  }, {} as Record<string, any>)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(defaultValues)
      setError(null)
    }
  }, [open, initialData])

  const submitHandler = async (data: Record<string, any>) => {
    setLoading(true)
    setError(null)
    try {
      for (const f of fields) {
        if (f.type === 'number') data[f.name] = Number(data[f.name])
      }
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
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          {fields.map((f) => (
            <div key={f.name} className="space-y-2">
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.type === 'checkbox' ? (
                <div className="flex items-center gap-2">
                  <Checkbox id={f.name} {...register(f.name)} />
                  <label htmlFor={f.name} className="text-sm text-muted-foreground">{f.label}</label>
                </div>
              ) : (
                <Input
                  id={f.name}
                  type={f.type === 'number' ? 'number' : 'text'}
                  {...register(f.name, { required: f.required !== false ? 'Requerido' : false })}
                />
              )}
              {errors[f.name] && <p className="text-xs text-destructive">{errors[f.name]?.message as string}</p>}
            </div>
          ))}

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
