import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface RetirarCohorteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: { motivo: string; fecha?: string }) => Promise<void>
  alumnoNombre?: string
}

export function RetirarCohorteModal({ open, onOpenChange, onConfirm, alumnoNombre }: RetirarCohorteModalProps) {
  const [motivo, setMotivo] = useState("")
  const [fecha, setFecha] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setMotivo(""); setFecha(""); setError(null) }
  }, [open])

  const handleConfirm = async () => {
    if (!motivo.trim()) { setError('El motivo es obligatorio'); return }
    setLoading(true)
    setError(null)
    try {
      await onConfirm({ motivo: motivo.trim(), fecha: fecha || undefined })
      onOpenChange(false)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'No se pudo retirar al alumno')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Retirar {alumnoNombre ? `a ${alumnoNombre}` : 'alumno'} de la cohorte</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={255} placeholder="Retiro voluntario, baja administrativa, egreso..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha (opcional, por defecto hoy)</Label>
            <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Retirando...' : 'Retirar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
