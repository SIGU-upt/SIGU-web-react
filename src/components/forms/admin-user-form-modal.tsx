import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Role, type Sede, type SedePnf } from "@/types"
import { PasswordRequirements, passwordMeetsRequirements, generateStrongPassword } from "@/components/forms/password-requirements"
import { Eye, EyeOff, Wand2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/config/api"
import { requiredTextRule, emailRule, ciRule } from "@/lib/validators"

const ROLE_LABELS: Record<string, string> = {
  [Role.RECTOR]: 'Rector',
  [Role.COORDINADOR]: 'Coordinador',
  [Role.AUDITOR]: 'Auditor',
}

interface AdminUserFormData {
  nombres: string
  apellidos: string
  ci: string
  email: string
  password: string
  role: Role
  sedeActualId?: string
  sedePnfId?: string
}

interface AdminUserFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AdminUserFormData) => Promise<void>
  allowedRoles: Role[]
  initialData?: Partial<AdminUserFormData>
  isEditing?: boolean
}

export function AdminUserFormModal({
  open,
  onOpenChange,
  onSubmit,
  allowedRoles,
  initialData,
  isEditing,
}: AdminUserFormModalProps) {
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sedeOptions, setSedeOptions] = useState<Sede[]>([])
  const [sedePnfOptions, setSedePnfOptions] = useState<SedePnf[]>([])
  const [selectedCoordSedeId, setSelectedCoordSedeId] = useState("")

  const defaultValues: AdminUserFormData = {
    nombres: '', apellidos: '', ci: '', email: '', password: '', role: allowedRoles[0],
  }

  const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm<AdminUserFormData>({
    defaultValues: { ...defaultValues, ...initialData },
  })
  const role = watch('role')
  const [showPassword, setShowPassword] = useState(false)
  const passwordValue = watch('password') || ''

  const showSedeField = role === Role.RECTOR && currentUser?.role === Role.SUPERADMIN
  const showSedePnfField = role === Role.COORDINADOR
  const ciEditable = currentUser?.role === Role.SUPERADMIN
  // Un rector administra una sola sede: al crear (o editar) un coordinador no
  // tiene sentido que elija entre sedes que no maneja, así que se preasigna la
  // suya y el selector queda bloqueado.
  const sedeLockedForRector = showSedePnfField && currentUser?.role === Role.RECTOR

  useEffect(() => {
    if (open) {
      reset({ ...defaultValues, role: allowedRoles[0], ...initialData })
      setSelectedCoordSedeId(
        currentUser?.role === Role.RECTOR && currentUser.sedeActualId ? currentUser.sedeActualId : "",
      )
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData, reset])

  useEffect(() => {
    if (!open) return
    if (showSedeField) {
      api.get('/sedes').then((res) => {
        const list = res.data.data ?? res.data
        setSedeOptions(Array.isArray(list) ? list : [])
      }).catch(() => setSedeOptions([]))
    }
    if (showSedePnfField) {
      api.get('/sede-pnf').then((res) => {
        const list = res.data.data ?? res.data
        setSedePnfOptions(Array.isArray(list) ? list : [])
      }).catch(() => setSedePnfOptions([]))
    }
  }, [open, showSedeField, showSedePnfField])

  // Al editar, deriva la sede seleccionada a partir del sedePnfId guardado, una
  // vez que las opciones ya cargaron (WEB #4/#5: sede y PNF son selects encadenados).
  useEffect(() => {
    if (!open || !showSedePnfField || !initialData?.sedePnfId || sedePnfOptions.length === 0) return
    const sp = sedePnfOptions.find((s) => s.id === initialData.sedePnfId)
    if (sp) setSelectedCoordSedeId(sp.sedeId)
  }, [open, showSedePnfField, initialData?.sedePnfId, sedePnfOptions])

  const coordSedeOptions = Array.from(
    new Map(sedePnfOptions.map((sp) => [sp.sedeId, sp.sede?.nombre ?? sp.sedeId])).entries(),
  ).map(([id, label]) => ({ id, label }))
  const coordPnfOptionsForSede = sedePnfOptions.filter((sp) => sp.sedeId === selectedCoordSedeId)

  const submitHandler = async (data: AdminUserFormData) => {
    setLoading(true)
    setError(null)
    try {
      // No enviar UUIDs vacíos: un AUDITOR (global) no tiene sede ni sede-PNF, y un
      // string vacío falla la validación @IsUUID del backend ("debe ser un uuid").
      const payload: AdminUserFormData = { ...data }
      if (!payload.sedeActualId) delete payload.sedeActualId
      if (!payload.sedePnfId) delete payload.sedePnfId
      await onSubmit(payload)
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
          <DialogTitle>{isEditing ? 'Editar Personal Administrativo' : 'Nuevo Personal Administrativo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Controller
              control={control}
              name="role"
              rules={{ required: 'Requerido' }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v)
                    setValue('sedeActualId', '')
                    setValue('sedePnfId', '')
                  }}
                  disabled={isEditing}
                >
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedRoles.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>
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
          {showSedeField && (
            <div className="space-y-2">
              <Label htmlFor="sedeActualId">Sede</Label>
              <Controller
                control={control}
                name="sedeActualId"
                rules={{ required: 'Requerido' }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="sedeActualId" className="w-full">
                      <SelectValue placeholder="Seleccione una sede" />
                    </SelectTrigger>
                    <SelectContent>
                      {sedeOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.sedeActualId && <p className="text-xs text-destructive">{errors.sedeActualId.message}</p>}
            </div>
          )}
          {showSedePnfField && (
            <>
              <div className="space-y-2">
                <Label htmlFor="coordSedeId">Sede</Label>
                {sedeLockedForRector && (
                  <p className="text-xs text-muted-foreground">Los coordinadores que cree pertenecen a su misma sede.</p>
                )}
                <Select
                  value={selectedCoordSedeId}
                  onValueChange={(v) => { setSelectedCoordSedeId(v); setValue('sedePnfId', '') }}
                  disabled={sedeLockedForRector}
                >
                  <SelectTrigger id="coordSedeId" className="w-full">
                    <SelectValue placeholder="Seleccione una sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {coordSedeOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sedePnfId">PNF</Label>
                <Controller
                  control={control}
                  name="sedePnfId"
                  rules={{ required: 'Requerido' }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={!selectedCoordSedeId}>
                      <SelectTrigger id="sedePnfId" className="w-full">
                        <SelectValue placeholder={selectedCoordSedeId ? "Seleccione un PNF" : "Elija primero una sede"} />
                      </SelectTrigger>
                      <SelectContent>
                        {coordPnfOptionsForSede.map((sp) => (
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
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
