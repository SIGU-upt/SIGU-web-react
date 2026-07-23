import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Role, type SedePnf, type Trayecto } from "@/types"
import { PasswordRequirements, passwordMeetsRequirements, generateStrongPassword } from "@/components/forms/password-requirements"
import { Eye, EyeOff, Wand2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/config/api"
import { requiredTextRule, emailRule, ciRule } from "@/lib/validators"

interface UserFormData {
  nombres: string
  apellidos: string
  ci: string
  email: string
  password: string
  role: Role.DOCENTE | Role.ALUMNO
  sedePnfId?: string
  trayectoId?: string
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
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sedePnfOptions, setSedePnfOptions] = useState<SedePnf[]>([])
  const [trayectoOptions, setTrayectoOptions] = useState<Trayecto[]>([])

  const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm<UserFormData>({
    defaultValues: { role: defaultRole, ...initialData },
  })
  const [showPassword, setShowPassword] = useState(false)
  const passwordValue = watch('password') || ''
  const sedePnfIdValue = watch('sedePnfId')

  const showPnfField = currentUser?.role === Role.SUPERADMIN || currentUser?.role === Role.RECTOR
  const showTrayectoField = defaultRole === Role.ALUMNO && !isEditing
  const effectiveSedePnfId = showPnfField ? sedePnfIdValue : currentUser?.sedePnfId

  useEffect(() => {
    if (open) {
      reset({ role: defaultRole, ...initialData })
      setError(null)
    }
  }, [open, initialData, defaultRole, reset])

  useEffect(() => {
    if (open && (showPnfField || showTrayectoField)) {
      api.get('/sede-pnf').then((res) => {
        const list = res.data.data ?? res.data
        setSedePnfOptions(Array.isArray(list) ? list : [])
      }).catch(() => setSedePnfOptions([]))
    }
  }, [open, showPnfField, showTrayectoField])

  useEffect(() => {
    if (!open || !showTrayectoField) return
    const pnfId = sedePnfOptions.find((sp) => sp.id === effectiveSedePnfId)?.pnfId
    if (!pnfId) {
      setTrayectoOptions([])
      return
    }
    api.get('/trayectos', { params: { pnfId } }).then((res) => {
      const list = res.data.data ?? res.data
      setTrayectoOptions(Array.isArray(list) ? list : [])
    }).catch(() => setTrayectoOptions([]))
  }, [open, showTrayectoField, effectiveSedePnfId, sedePnfOptions])

  const submitHandler = async (data: UserFormData) => {
    setLoading(true)
    setError(null)
    try {
      // No enviar UUIDs vacíos al backend (fallan la validación @IsUUID).
      const payload: UserFormData = { ...data }
      if (!payload.sedePnfId) delete payload.sedePnfId
      await onSubmit(payload)
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
              <Input id="nombres" {...register('nombres', requiredTextRule)} />
              {errors.nombres && <p className="text-xs text-destructive">{errors.nombres.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input id="apellidos" {...register('apellidos', requiredTextRule)} />
              {errors.apellidos && <p className="text-xs text-destructive">{errors.apellidos.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ci">Cédula</Label>
            <Input id="ci" placeholder="V-12345678" {...register('ci', ciRule)} disabled={isEditing} />
            {errors.ci && <p className="text-xs text-destructive">{errors.ci.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="usuario@uptjfr.edu.ve" {...register('email', emailRule)} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          {showPnfField && (
            <div className="space-y-2">
              <Label htmlFor="sedePnfId">PNF</Label>
              {isEditing && (
                <p className="text-xs text-muted-foreground">Reasignar el PNF trasladará al usuario a otra sede-PNF.</p>
              )}
              <Controller
                control={control}
                name="sedePnfId"
                rules={{ required: 'Requerido' }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="sedePnfId" className="w-full">
                      <SelectValue placeholder="Seleccione un PNF" />
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
          )}
          {showTrayectoField && (
            <div className="space-y-2">
              <Label htmlFor="trayectoId">Trayecto actual</Label>
              <p className="text-xs text-muted-foreground">Opcional: si el alumno ya viene cursando un trayecto (ej. ingresa a 4to año), selecciónelo aquí para registrar su cohorte oficial.</p>
              <Controller
                control={control}
                name="trayectoId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!effectiveSedePnfId}>
                    <SelectTrigger id="trayectoId" className="w-full">
                      <SelectValue placeholder={effectiveSedePnfId ? "Sin asignar aún" : "Seleccione un PNF primero"} />
                    </SelectTrigger>
                    <SelectContent>
                      {trayectoOptions.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    className="pr-10"
                    {...register('password', {
                      required: !isEditing ? 'Requerido' : false,
                      validate: (value) => passwordMeetsRequirements(value) || 'La contraseña no cumple los requisitos',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setValue('password', generateStrongPassword(), { shouldValidate: true })
                    setShowPassword(true)
                  }}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generar
                </Button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              <PasswordRequirements password={passwordValue} />
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
