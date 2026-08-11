import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Role, type SedePnf, type Trayecto, type PeriodoAcademico } from "@/types"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/config/api"
import { requiredTextRule } from "@/lib/validators"

interface CohorteGrupoFormData {
  nombre: string
  sedePnfId: string
  trayectoId: string
  periodoIngresoId: string
  cupo?: number
}

interface CohorteGrupoFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CohorteGrupoFormData) => Promise<void>
  initialData?: Partial<CohorteGrupoFormData>
  isEditing?: boolean
}

export function CohorteGrupoFormModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing,
}: CohorteGrupoFormModalProps) {
  const { user: currentUser } = useAuth()
  const isCoordinador = currentUser?.role === Role.COORDINADOR
  const isRector = currentUser?.role === Role.RECTOR
  const isSuperadmin = currentUser?.role === Role.SUPERADMIN

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sedePnfOptions, setSedePnfOptions] = useState<SedePnf[]>([])
  const [trayectoOptions, setTrayectoOptions] = useState<Trayecto[]>([])
  const [periodoOptions, setPeriodoOptions] = useState<PeriodoAcademico[]>([])
  const [selectedSedeId, setSelectedSedeId] = useState("")

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<CohorteGrupoFormData>({
    defaultValues: { nombre: '', sedePnfId: '', trayectoId: '', periodoIngresoId: '', ...initialData },
  })
  const sedePnfId = watch('sedePnfId')

  useEffect(() => {
    if (open) {
      reset({
        nombre: '', sedePnfId: '', trayectoId: '', periodoIngresoId: '', ...initialData,
        ...(isCoordinador && currentUser?.sedePnfId ? { sedePnfId: currentUser.sedePnfId } : {}),
      })
      setSelectedSedeId(isRector && currentUser?.sedeActualId ? currentUser.sedeActualId : "")
      setError(null)
    }
  }, [open, initialData, reset, isCoordinador, isRector, currentUser])

  useEffect(() => {
    if (open) {
      api.get('/sede-pnf').then((res) => {
        const list = res.data.data ?? res.data
        setSedePnfOptions(Array.isArray(list) ? list : [])
      }).catch(() => setSedePnfOptions([]))
    }
  }, [open])

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
    if (!sedePnfId) {
      setTrayectoOptions([])
      setPeriodoOptions([])
      return
    }
    const pnfId = sedePnfOptions.find((sp) => sp.id === sedePnfId)?.pnfId
    if (pnfId) {
      api.get('/trayectos', { params: { pnfId } }).then((res) => {
        const list = res.data.data ?? res.data
        setTrayectoOptions(Array.isArray(list) ? list : [])
      }).catch(() => setTrayectoOptions([]))
    }
    api.get('/periodos', { params: { sedePnfId } }).then((res) => {
      const list = res.data.data ?? res.data
      setPeriodoOptions(Array.isArray(list) ? list : [])
    }).catch(() => setPeriodoOptions([]))
  }, [sedePnfId, sedePnfOptions])

  const submitHandler = async (data: CohorteGrupoFormData) => {
    setLoading(true)
    setError(null)
    try {
      await onSubmit({ ...data, cupo: data.cupo ? Number(data.cupo) : undefined })
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
          <DialogTitle>{isEditing ? 'Editar Cohorte' : 'Nueva Cohorte'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" placeholder="2026-I Informática Socopó" {...register('nombre', { ...requiredTextRule, maxLength: { value: 150, message: 'Máximo 150 caracteres' } })} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>
          {isSuperadmin && (
            <div className="space-y-2">
              <Label htmlFor="sedeId">Sede</Label>
              <Select
                value={selectedSedeId}
                onValueChange={(v) => { setSelectedSedeId(v); setValue('sedePnfId', ''); setValue('trayectoId', ''); setValue('periodoIngresoId', '') }}
              >
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
          )}
          {(isSuperadmin || isRector) && (
            <div className="space-y-2">
              <Label htmlFor="sedePnfId">PNF</Label>
              <Controller
                control={control}
                name="sedePnfId"
                rules={{ required: 'Requerido' }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => { field.onChange(v); setValue('trayectoId', ''); setValue('periodoIngresoId', '') }} disabled={!selectedSedeId}>
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
          )}
          <div className="space-y-2">
            <Label htmlFor="trayectoId">Trayecto de ingreso</Label>
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
            <Label htmlFor="periodoIngresoId">Período de ingreso</Label>
            <Controller
              control={control}
              name="periodoIngresoId"
              rules={{ required: 'Requerido' }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!sedePnfId}>
                  <SelectTrigger id="periodoIngresoId" className="w-full">
                    <SelectValue placeholder={sedePnfId ? "Seleccione un período" : "Elija primero una sede-PNF"} />
                  </SelectTrigger>
                  <SelectContent>
                    {periodoOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}{p.activo ? ' (activo)' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.periodoIngresoId && <p className="text-xs text-destructive">{errors.periodoIngresoId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cupo">Cupo (opcional)</Label>
            <Input id="cupo" type="number" min={1} placeholder="Sin límite" {...register('cupo', { valueAsNumber: true, min: { value: 1, message: 'Debe ser al menos 1' } })} />
            {errors.cupo && <p className="text-xs text-destructive">{errors.cupo.message}</p>}
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Cohorte'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
