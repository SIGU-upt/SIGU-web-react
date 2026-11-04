import { useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import api from "@/config/api"
import { getErrorMessage } from "@/lib/errors"
import type { PeriodoAcademico } from "@/types"

interface CrearPeriodoRapidoModalProps {
  open: boolean
  sedePnfId: string
  onOpenChange: (open: boolean) => void
  onCreated: (periodo: PeriodoAcademico) => void
}

/**
 * Atajo para el caso "quise hacer algo que necesita un período activo, pero esta
 * sede-PNF no tiene ninguno" (matricular un alumno, cambiarle el trayecto): antes
 * el único camino era ir a Configuración → Períodos a mano. Crea el período y
 * deja que quien llamó decida qué hacer (reintentar la acción, avisar, etc.) — no
 * reintenta nada por su cuenta.
 */
export function CrearPeriodoRapidoModal({ open, sedePnfId, onOpenChange, onCreated }: CrearPeriodoRapidoModalProps) {
  const [nombre, setNombre] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [loading, setLoading] = useState(false)

  const limpiar = () => {
    setNombre("")
    setFechaInicio("")
    setFechaFin("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post<PeriodoAcademico>('/periodos', {
        nombre,
        fechaInicio,
        fechaFin,
        sedePnfId,
        activo: true,
      })
      limpiar()
      onOpenChange(false)
      onCreated(res.data)
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo crear el período'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) limpiar(); onOpenChange(next) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear período para esta sede-PNF</DialogTitle>
          <DialogDescription>
            Esta sede-PNF no tiene un período académico activo. Créelo aquí para poder continuar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="periodo-rapido-nombre">Nombre</Label>
            <Input id="periodo-rapido-nombre" placeholder="2026-2" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodo-rapido-inicio">Fecha inicio</Label>
              <Input id="periodo-rapido-inicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodo-rapido-fin">Fecha fin</Label>
              <Input id="periodo-rapido-fin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear período'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
