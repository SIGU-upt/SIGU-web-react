import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getErrorMessage } from "@/lib/errors"
import type { Pnf } from "@/types"
import api from "@/config/api"

interface VincularPnfModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sedeId: string
  sedeNombre: string
  // PNF que la sede ya ofrece: no se vuelven a ofrecer en la lista.
  pnfIdsVinculados: string[]
  onDone: () => void
}

// Ofrece un PNF más en una sede (POST /sede-pnf). La lista trae solo los PNF que la sede todavía no tiene;
// el servidor igualmente valida que existan y que no estén duplicados.
export function VincularPnfModal({ open, onOpenChange, sedeId, sedeNombre, pnfIdsVinculados, onDone }: VincularPnfModalProps) {
  const [pnfs, setPnfs] = useState<Pnf[]>([])
  const [pnfId, setPnfId] = useState("")
  const [loadingLista, setLoadingLista] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setPnfId("")
    setError(null)
    setLoadingLista(true)
    api.get("/pnfs", { params: { limit: 200 } })
      .then((res) => {
        const lista = res.data.data ?? res.data
        setPnfs(Array.isArray(lista) ? lista : [])
      })
      .catch(() => {
        setPnfs([])
        setError("No se pudo cargar la lista de PNF.")
      })
      .finally(() => setLoadingLista(false))
  }, [open])

  const disponibles = pnfs
    .filter((p) => !pnfIdsVinculados.includes(p.id))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const vincular = async () => {
    if (!pnfId) return
    setLoading(true)
    setError(null)
    try {
      await api.post("/sede-pnf", { sedeId, pnfId })
      toast.success("PNF vinculado a la sede.")
      onDone()
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo vincular el PNF"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(abierto) => { if (!loading) onOpenChange(abierto) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular PNF</DialogTitle>
          <DialogDescription>Elija el PNF que se ofrecerá en {sedeNombre}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="vincular-pnf">PNF</Label>
          {loadingLista ? (
            <p className="text-sm text-muted-foreground">Cargando PNF...</p>
          ) : disponibles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Esta sede ya ofrece todos los PNF existentes.</p>
          ) : (
            <Select value={pnfId} onValueChange={setPnfId}>
              <SelectTrigger id="vincular-pnf" className="w-full"><SelectValue placeholder="Seleccione un PNF" /></SelectTrigger>
              <SelectContent>
                {disponibles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre} ({p.codigo})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {error && <FormError>{error}</FormError>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button type="button" onClick={vincular} disabled={loading || !pnfId}>{loading ? "Vinculando..." : "Vincular"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
