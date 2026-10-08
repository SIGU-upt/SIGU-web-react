import { useState, useEffect, useRef } from "react"
import { Paperclip, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const TIPOS_ACEPTADOS = "image/jpeg,image/png,image/webp,application/pdf"
const TAMANO_MAXIMO = 5 * 1024 * 1024

interface JustificarAsistenciaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: { motivo: string; evidencia?: File }) => Promise<void>
  alumnoNombre?: string
}

export function JustificarAsistenciaModal({ open, onOpenChange, onConfirm, alumnoNombre }: JustificarAsistenciaModalProps) {
  const [motivo, setMotivo] = useState("")
  const [evidencia, setEvidencia] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setMotivo(""); setEvidencia(null); setError(null) }
  }, [open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > TAMANO_MAXIMO) {
      setError('El archivo no puede superar los 5 MB')
      e.target.value = ""
      return
    }
    setError(null)
    setEvidencia(file)
  }

  const handleConfirm = async () => {
    if (!motivo.trim()) { setError('El motivo es obligatorio'); return }
    setLoading(true)
    setError(null)
    try {
      await onConfirm({ motivo: motivo.trim(), evidencia: evidencia ?? undefined })
      onOpenChange(false)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'No se pudo justificar la inasistencia')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Justificar {alumnoNombre ? `a ${alumnoNombre}` : 'inasistencia'}</DialogTitle>
          <DialogDescription>Una falta justificada cuenta como asistencia válida.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={255} placeholder="Reposo médico, permiso institucional..." />
          </div>
          <div className="space-y-2">
            <Label>Evidencia (opcional)</Label>
            <input ref={fileInputRef} type="file" accept={TIPOS_ACEPTADOS} onChange={handleFileChange} className="hidden" />
            {evidencia ? (
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span className="truncate">{evidencia.name}</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { setEvidencia(null); if (fileInputRef.current) fileInputRef.current.value = "" }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="mr-2 h-4 w-4" />
                Adjuntar foto o documento
              </Button>
            )}
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP o PDF — máximo 5 MB.</p>
          </div>
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Justificando...' : 'Justificar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
