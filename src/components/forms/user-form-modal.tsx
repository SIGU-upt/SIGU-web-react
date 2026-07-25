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
  const [selectedSedeId, setSelectedSedeId] = useState("")

  const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm<UserFormData>({
    defaultValues: { role: defaultRole, ...initialData },
  })
  const [showPassword, setShowPassword] = useState(false)
  const passwordValue = watch('password') || ''
  const sedePnfIdValue = watch('sedePnfId')

  const showPnfField = currentUser?.role === Role.SUPERADMIN || currentUser?.role === Role.RECTOR
  const showTrayectoField = defaultRole === Role.ALUMNO
  const ciEditable = currentUser?.role === Role.SUPERADMIN
  const effectiveSedePnfId = showPnfField ? sedePnfIdValue : currentUser?.sedePnfId

  useEffect(() => {
    if (open) {
      reset({ role: defaultRole, ...initialData })
      setSelectedSedeId("")
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

  // Al editar, deriva la sede seleccionada a partir del sedePnfId guardado, una
  // vez que las opciones ya cargaron (WEB #4/#5: sede y PNF son selects encadenados).
  useEffect(() => {
    if (!open || !initialData?.sedePnfId || sedePnfOptions.length === 0) return
    const sp = sedePnfOptions.find((s) => s.id === initialData.sedePnfId)
    if (sp) setSelectedSedeId(sp.sedeId)
  }, [open, initialData?.sedePnfId, sedePnfOptions])

  const sedeOptions = Array.from(
    new Map(sedePnfOptions.map((sp) => [sp.sedeId, sp.sede?.nombre ?? sp.sedeId])).entries(),
  ).map(([id, label]) => ({ id, label }))
  const pnfOptionsForSede = sedePnfOptions.filter((sp) => sp.sedeId === selectedSedeId)

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
            <Input id="ci" placeholder="V-12345678" {...register('ci', ciRule)} disabled={isEditing && !ciEditable} />
            {errors.ci && <p className="text-xs text-destructive">{errors.ci.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="usuario@uptjfr.edu.ve" {...register('email', emailRule)} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          {showPnfField && (
            <>
              <div className="space-y-2">
                <Label htmlFor="sedeId">Sede</Label>
                <Select value={selectedSedeId} onValueChange={(v) => { setSelectedSedeId(v); setValue('sedePnfId', '') }}>
                  <SelectTrigger id="sedeId" className="w-full">
                    <SelectValue placeholder="Seleccione una sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {sedeOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                    <Select value={field.value} onValueChange={field.onChange} disabled={!selectedSedeId}>
                      <SelectTrigger id="sedePnfId" className="w-full">
                        <SelectValue placeholder={selectedSedeId ? "Seleccione un PNF" : "Elija primero una sede"} />
                      </SelectTrigger>
                      <SelectContent>
                        {pnfOptionsForSede.map((sp) => (
                          <SelectItem key={sp.id} value={sp.id}>{sp.pnf?.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.sedePnfId && <p className="text-xs text-destructive">{errors.sedePnfId.message}</p>}
              </div>
            </>
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
