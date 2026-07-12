import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Role } from "@/types"

interface UserFormData {
  nombres: string
  apellidos: string
  ci: string
  email: string
  password: string
  role: Role.DOCENTE | Role.ALUMNO
}

interface UserFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: UserFormData) => Promise<void>
  defaultRole: Role.DOCENTE | Role.ALUMNO
  initialData?: Partial<UserFormData>
  isEditing?: boolean
}

export function UserFormModal({
  open,
  onOpenChange,
  onSubmit,
  defaultRole,
  initialData,
  isEditing,
}: UserFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>({
    defaultValues: { role: defaultRole, ...initialData },
  })

  useEffect(() => {
    if (open) {
      reset({ role: defaultRole, ...initialData })
      setError(null)
    }
  }, [open, initialData, defaultRole, reset])

  const submitHandler = async (data: UserFormData) => {
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

  const roleLabel = defaultRole === Role.DOCENTE ? 'Docente' : 'Estudiante'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Editar ${roleLabel}` : `Nuevo ${roleLabel}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres</Label>
              <Input id="nombres" {...register('nombres', { required: 'Requerido' })} />
              {errors.nombres && <p className="text-xs text-destructive">{errors.nombres.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input id="apellidos" {...register('apellidos', { required: 'Requerido' })} />
              {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ci">Cédula</Label>
            <Input id="ci" placeholder="V-12345678" {...register('ci', { required: 'Requerido' })} disabled={isEditing} />
            {errors.ci && <p className="text-xs text-destructive">{errors.ci.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="usuario@uptjfr.edu.ve" {...register('email', { required: 'Requerido' })} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="Mínimo 8 caracteres" {...register('password', { required: !isEditing ? 'Requerido' : false })} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          )}

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : `Crear ${roleLabel}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
