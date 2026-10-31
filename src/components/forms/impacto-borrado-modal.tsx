import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/errors"
import api from "@/config/api"

interface Dependencia {
  tipo: string
  cantidad: number
}
interface ImpactoBorrado {
  estructural: Dependencia[]
  dataViva: Dependencia[]
}

interface ImpactoBorradoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Endpoint del recurso sin el id, ej. "/sedes" — se le agrega "/:id" y
  // "/:id/impacto-borrado".
  endpoint: string
  itemId: string
  itemLabel: string
  // `force` solo se manda como true si el usuario marcó la casilla.
  onConfirm: (force: boolean) => Promise<void>
  // Si se indica, "Eliminar" solo se habilita después de escribir este texto (el nombre del
  // registro): un doble chequeo para borrados que arrastran mucho, como el de una sede.
  confirmarEscribiendo?: string
}

// Se ignoran mayúsculas, tildes y espacios sobrantes: lo que importa es que haya leído el nombre.
const normalizar = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase()

/**
 * Antes de borrar Sede/PNF/Sede-PNF (los únicos recursos con cascada y
 * GET :id/impacto-borrado en el backend), muestra cuánto se arrastraría:
 * lo "estructural" (secciones, clases, inscripciones...) se borra siempre
 * en cascada; lo de "datos con historial" (asistencias, suspensiones)
 * bloquea el borrado salvo que se marque forzar — mismo criterio que ya
 * aplica el backend (`assertBorradoPermitido`), mostrado aquí en vez de
 * solo como un 409 genérico.
 */
export function ImpactoBorradoModal({ open, onOpenChange, endpoint, itemId, itemLabel, onConfirm, confirmarEscribiendo }: ImpactoBorradoModalProps) {
  const [escrito, setEscrito] = useState("")
  const [loading, setLoading] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [impacto, setImpacto] = useState<ImpactoBorrado | null>(null)
  const [forzar, setForzar] = useState(false)

  useEffect(() => {
    if (!open) return
    setImpacto(null)
    setForzar(false)
    setEscrito("")
    setError(null)
    setLoading(true)
    api.get<ImpactoBorrado>(`${endpoint}/${itemId}/impacto-borrado`)
      .then((res) => setImpacto(res.data))
      .catch((err) => setError(getErrorMessage(err, "No se pudo calcular el impacto del borrado")))
      .finally(() => setLoading(false))
  }, [open, endpoint, itemId])

  const tieneDataViva = (impacto?.dataViva ?? []).some((d) => d.cantidad > 0)
  const tieneEstructural = (impacto?.estructural ?? []).some((d) => d.cantidad > 0)
  const nombreConfirmado = !confirmarEscribiendo || normalizar(escrito) === normalizar(confirmarEscribiendo)
  const puedeConfirmar = (!tieneDataViva || forzar) && nombreConfirmado

  const handleConfirm = async () => {
    if (!puedeConfirmar) return
    setEliminando(true)
    setError(null)
    try {
      await onConfirm(forzar)
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo eliminar"))
    } finally {
      setEliminando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!eliminando) onOpenChange(v) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Eliminar {itemLabel}
          </DialogTitle>
          <DialogDescription>
            Esto también elimina (borrado lógico, se puede auditar después) todo lo que depende de este registro.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Calculando impacto...</p>
        ) : impacto ? (
          <div className="space-y-4">
            {!tieneEstructural && !tieneDataViva && (
              <p className="text-sm text-muted-foreground">No tiene nada vinculado — se puede eliminar sin afectar otros datos.</p>
            )}
            {tieneEstructural && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Se eliminará también</p>
                <ul className="text-sm space-y-0.5">
                  {impacto.estructural.filter((d) => d.cantidad > 0).map((d) => (
                    <li key={d.tipo} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{d.tipo}</span>
                      <span className="font-mono font-medium">{d.cantidad}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tieneDataViva && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 space-y-2">
                <p className="text-xs font-medium text-destructive uppercase tracking-wide">Datos con historial (bloquean el borrado)</p>
                <ul className="text-sm space-y-0.5">
                  {impacto.dataViva.filter((d) => d.cantidad > 0).map((d) => (
                    <li key={d.tipo} className="flex justify-between gap-4">
                      <span>{d.tipo}</span>
                      <span className="font-mono font-medium">{d.cantidad}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Si prefiere no perder esta información, cancele y revise/depure esos registros desde su propia
                  pantalla antes de eliminar {itemLabel.toLowerCase()}.
                </p>
                <label className="flex items-start gap-2 pt-1 cursor-pointer">
                  <Checkbox checked={forzar} onCheckedChange={(v) => setForzar(v === true)} className="mt-0.5" />
                  <span className="text-sm">Entiendo, eliminar de todas formas (se pierde este historial)</span>
                </label>
              </div>
            )}
            {confirmarEscribiendo && (
              <div className="space-y-2">
                <Label htmlFor="confirmar-nombre" className="text-sm font-normal">
                  Para confirmar, escriba el nombre exacto: <span className="font-semibold">{confirmarEscribiendo}</span>
                </Label>
                <Input
                  id="confirmar-nombre"
                  value={escrito}
                  onChange={(e) => setEscrito(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleConfirm() } }}
                  placeholder={confirmarEscribiendo}
                  autoComplete="off"
                  disabled={eliminando}
                />
              </div>
            )}
          </div>
        ) : null}

        {error &&<p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={eliminando}>Cancelar</Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading || eliminando || !impacto || !puedeConfirmar}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {eliminando ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
