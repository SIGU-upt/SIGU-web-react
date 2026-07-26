import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Role, type SedePnf, type Trayecto } from "@/types"
import { useAuth } from "@/contexts/AuthContext"
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
  const { user: currentUser } = useAuth()
  // Un coordinador administra una sola sede-PNF: no elige nada, se le fija la
  // suya. Un rector administra una sola sede: elige el PNF (entre los suyos)
  // pero no la sede. Solo superadmin ve la cascada completa.
  const isCoordinador = currentUser?.role === Role.COORDINADOR
  const isRector = currentUser?.role === Role.RECTOR
  const isSuperadmin = currentUser?.role === Role.SUPERADMIN

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sedePnfOptions, setSedePnfOptions] = useState<SedePnf[]>([])
  const [trayectoOptions, setTrayectoOptions] = useState<Trayecto[]>([])
  const [selectedSedeId, setSelectedSedeId] = useState("")

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<SeccionFormData>({
    defaultValues: { sedePnfId: '', trayectoId: '', codigo: '', ...initialData },
  })
  const sedePnfId = watch('sedePnfId')

  useEffect(() => {
    if (open) {
      reset({
        sedePnfId: '', trayectoId: '', codigo: '', ...initialData,
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
          {isSuperadmin && (
            <div className="space-y-2">
              <Label htmlFor="sedeId">Sede</Label>
              <Select
                value={selectedSedeId}
                onValueChange={(v) => { setSelectedSedeId(v); setValue('sedePnfId', ''); setValue('trayectoId', '') }}
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
                  <Select value={field.value} onValueChange={(v) => { field.onChange(v); setValue('trayectoId', '') }} disabled={!selectedSedeId}>
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
