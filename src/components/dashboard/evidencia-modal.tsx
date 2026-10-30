import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/form-error"
import api from "@/config/api"

const EXTENSIONES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
}

interface EvidenciaModalProps {
  // Id de la asistencia justificada; null mantiene el modal cerrado.
  asistenciaId: string | null
  descripcion?: string
  onClose: () => void
}

// Muestra la evidencia de una justificación (GET /attendance/:id/evidencia) en la
// misma página, sin descargarla ni abrir otra pestaña. La API exige el header
// Authorization, así que el archivo se pide con axios y se enseña desde un blob.
export function EvidenciaModal({ asistenciaId, descripcion, onClose }: EvidenciaModalProps) {
  const [archivo, setArchivo] = useState<{ url: string; tipo: string } | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!asistenciaId) return
    let cancelado = false
    let blobUrl: string | null = null
    setArchivo(null)
    setError(false)
    api.get(`/attendance/${asistenciaId}/evidencia`, { responseType: "blob" })
      .then((res) => {
        if (cancelado) return
        blobUrl = URL.createObjectURL(res.data)
        setArchivo({ url: blobUrl, tipo: res.data.type })
      })
      .catch(() => { if (!cancelado) setError(true) })
    return () => {
      cancelado = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [asistenciaId])

  const esPdf = archivo?.tipo === "application/pdf"

  return (
    <Dialog open={!!asistenciaId} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Evidencia de la justificación</DialogTitle>
          {descripcion && <DialogDescription>{descripcion}</DialogDescription>}
        </DialogHeader>

        {error ? (
          <FormError>No se pudo cargar la evidencia.</FormError>
        ) : !archivo ? (
          <div className="py-12 text-center text-muted-foreground">Cargando evidencia...</div>
        ) : esPdf ? (
          <iframe src={archivo.url} title="Evidencia de la justificación" className="h-[70vh] w-full rounded-md border border-border" />
        ) : (
          <img src={archivo.url} alt="Evidencia de la justificación" className="mx-auto max-h-[70vh] w-auto max-w-full rounded-md border border-border object-contain" />
        )}

        <DialogFooter>
          {archivo && (
            <Button asChild variant="outline">
              <a href={archivo.url} download={`evidencia${EXTENSIONES[archivo.tipo] ?? ""}`}>
                <Download className="mr-2 h-4 w-4" />Descargar
              </a>
            </Button>
          )}
          <Button type="button" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
