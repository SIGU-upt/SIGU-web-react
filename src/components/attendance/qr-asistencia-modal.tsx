import { useEffect, useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import api from "@/config/api"

interface QrAsistenciaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  claseId: string
  nombreClase: string
}

// Mismo flujo que ya usa la app Flutter (teacher_dashboard_page.dart): pide
// un token a POST /classes/:id/open, lo codifica tal cual en el QR, y lo
// renueva antes de que venza — 5s de margen sobre la vigencia real para que
// un escaneo justo al final del conteo regresivo siga llegando a tiempo
// aunque la red sea lenta. Mismo backend, mismo endpoint: no se inventa
// ningún mecanismo nuevo, solo un cliente web del que ya existe.
export function QrAsistenciaModal({ open, onOpenChange, claseId, nombreClase }: QrAsistenciaModalProps) {
  const [token, setToken] = useState<string | null>(null)
  const [segundosRestantes, setSegundosRestantes] = useState(0)
  const [error, setError] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const pedirToken = async () => {
    try {
      const res = await api.post<{ token: string; expiresIn: number }>(`/classes/${claseId}/open`)
      const vigenciaReal = res.data.expiresIn || 30
      const vigencia = vigenciaReal > 5 ? vigenciaReal - 5 : vigenciaReal
      setToken(res.data.token)
      setSegundosRestantes(vigencia)
      setError(false)
    } catch {
      setError(true)
    }
  }

  useEffect(() => {
    if (!open) {
      setToken(null)
      setError(false)
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    pedirToken()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, claseId])

  useEffect(() => {
    if (!open || !token) return
    timerRef.current = setInterval(() => {
      setSegundosRestantes((s) => {
        if (s <= 1) {
          pedirToken()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Asistencia — {nombreClase}</DialogTitle>
          <DialogDescription>
            El estudiante escanea este código desde la app. Se renueva solo, no hace falta recargar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {error ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-destructive">No se pudo abrir la asistencia.</p>
              <Button variant="outline" size="sm" onClick={pedirToken}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
              </Button>
            </div>
          ) : !token ? (
            <p className="py-16 text-sm text-muted-foreground">Generando código...</p>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-white p-4">
                <QRCodeSVG value={token} size={220} />
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">
                Se renueva en {segundosRestantes}s
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
