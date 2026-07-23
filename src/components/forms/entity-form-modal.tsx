import { useState, useEffect, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/config/api"
import { requiredTextRule, nonNegativeNumberRule } from "@/lib/validators"

export interface EntityField {
  name: string
  label: string
  type?: 'text' | 'number' | 'checkbox' | 'select' | 'date'
  required?: boolean
  optionsEndpoint?: string
  optionLabel?: (item: any) => string
  optionValue?: (item: any) => string
  // Solo se muestra al CREAR (se oculta al editar). Útil para inputs que disparan
  // generación (ej. cantidad de trayectos al crear un PNF), que no aplican al editar.
  createOnly?: boolean
  // Valor inicial del campo al crear (ej. requierePiu por defecto en true).
  defaultValue?: unknown
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
  const [optionsByField, setOptionsByField] = useState<Record<string, any[]>>({})

  // Al editar se ocultan los campos marcados como createOnly.
  const visibleFields = useMemo(
    () => (isEditing ? fields.filter((f) => !f.createOnly) : fields),
    [fields, isEditing],
  )

  const defaultValues = visibleFields.reduce((acc, f) => {
    acc[f.name] =
      initialData?.[f.name] ?? f.defaultValue ?? (f.type === 'checkbox' ? false : '')
    return acc
  }, {} as Record<string, any>)

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(defaultValues)
      setError(null)
    }
  }, [open, initialData])

  useEffect(() => {
    if (!open) return
    const selectFields = visibleFields.filter((f) => f.type === 'select' && f.optionsEndpoint)
    selectFields.forEach((f) => {
      api.get(f.optionsEndpoint!).then((res) => {
        const list = res.data.data ?? res.data
        setOptionsByField((prev) => ({ ...prev, [f.name]: Array.isArray(list) ? list : [] }))
      }).catch(() => setOptionsByField((prev) => ({ ...prev, [f.name]: [] })))
    })
  }, [open, visibleFields])

  const submitHandler = async (data: Record<string, any>) => {
    setLoading(true)
    setError(null)
    try {
      for (const f of visibleFields) {
        if (f.type === 'number') data[f.name] = Number(data[f.name])
        if (f.type === 'date' && !data[f.name]) data[f.name] = undefined
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
          {visibleFields.map((f) => (
            <div key={f.name} className="space-y-2">
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.type === 'checkbox' ? (
                <div className="flex items-center gap-2">
                  <Checkbox id={f.name} {...register(f.name)} />
                  <label htmlFor={f.name} className="text-sm text-muted-foreground">{f.label}</label>
                </div>
              ) : f.type === 'select' ? (
                <Controller
                  control={control}
                  name={f.name}
                  rules={{ required: f.required !== false ? 'Requerido' : false }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={f.name} className="w-full">
                        <SelectValue placeholder={`Seleccione ${f.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(optionsByField[f.name] ?? []).map((opt) => {
                          const value = f.optionValue ? f.optionValue(opt) : opt.id
                          const label = f.optionLabel ? f.optionLabel(opt) : opt.nombre
                          return <SelectItem key={value} value={value}>{label}</SelectItem>
                        })}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                <Input
                  id={f.name}
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  {...register(
                    f.name,
                    f.type === 'number'
                      ? { ...nonNegativeNumberRule, required: f.required !== false ? 'Requerido' : false }
                      : f.type === 'text' && f.required !== false
                        ? requiredTextRule
                        : { required: f.required !== false ? 'Requerido' : false },
                  )}
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
