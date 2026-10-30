import { useEffect, useState } from "react"
import { Check, Copy, KeyRound, TriangleAlert } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/form-error"
import { getErrorMessage } from "@/lib/errors"
import api from "@/config/api"

interface ResetPasswordModalProps {
  // La persona a la que se le genera la clave; null mantiene el modal cerrado.
  usuario: { id: string | number; nombre: string } | null
  onClose: () => void
}

// Genera una contraseña temporal (PATCH /users/:id/reset-password). El servidor la devuelve UNA sola vez:
// primero se pide confirmación, y después se muestra con un botón de copiar para dictársela a la persona.
export function ResetPasswordModal({ usuario, onClose }: ResetPasswordModalProps) {
  const [temporal, setTemporal] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    setTemporal(null)
    setError(null)
    setCopiado(false)
  }, [usuario?.id])

  const generar = async () => {
    if (!usuario) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.patch(`/users/${usuario.id}/reset-password`)
      setTemporal(res.data.temporaryPassword)
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo generar la contraseña temporal"))
    } finally {
      setLoading(false)
    }
  }

  const copiar = async () => {
    if (!temporal) return
    try {
      await navigator.clipboard.writeText(temporal)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sin permiso de portapapeles: se deja la clave seleccionada para copiarla a mano.
      document.getElementById("clave-temporal")?.focus()
    }
  }

  return (
    <Dialog open={!!usuario} onOpenChange={(abierto) => { if (!abierto && !loading) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            {temporal ? "Contraseña temporal generada" : "Generar contraseña temporal"}
          </DialogTitle>
          <DialogDescription>
            {temporal
              ? `Contraseña de ${usuario?.nombre}`
              : `Se generará una contraseña nueva para ${usuario?.nombre} y la actual dejará de funcionar.`}
          </DialogDescription>
        </DialogHeader>

        {temporal ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="clave-temporal"
                readOnly
                value={temporal}
                onFocus={(e) => e.currentTarget.select()}
                className="h-10 flex-1 rounded-md border border-input bg-muted px-3 font-mono text-base tracking-wide"
                aria-label="Contraseña temporal"
              />
              <Button type="button" variant="outline" onClick={copiar}>
                {copiado ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copiado ? "Copiada" : "Copiar"}
              </Button>
            </div>
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              No se puede volver a consultar. Dicte o envíe la contraseña a la persona ahora; al cerrar esta ventana se pierde.
            </p>
          </div>
        ) : (
          error && <FormError>{error}</FormError>
        )}

        <DialogFooter>
          {temporal ? (
            <Button type="button" onClick={onClose}>Listo</Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
              <Button type="button" onClick={generar} disabled={loading}>{loading ? "Generando..." : "Generar"}</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
