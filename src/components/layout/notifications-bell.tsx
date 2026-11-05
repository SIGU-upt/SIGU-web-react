import { useCallback, useEffect, useState } from "react"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import api from "@/config/api"

interface Notificacion {
  id: string
  tipo: string
  mensaje: string
  leida: boolean
  createdAt: string
}

const POLL_MS = 60_000

// Campanita real: GET /notificaciones/no-leidas/count en cada carga y cada
// minuto (el sistema no tiene push todavía), lista real al abrir el menú,
// marcar leída/todas. Antes esto era 100% decorativo (unreadCount fijo en 0).
export function NotificationsBell() {
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<Notificacion[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCount = useCallback(() => {
    api.get<{ count: number }>('/notificaciones/no-leidas/count')
      .then((res) => setCount(res.data.count))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, POLL_MS)
    return () => clearInterval(interval)
  }, [fetchCount])

  const onOpenChange = (open: boolean) => {
    if (!open) return
    setLoading(true)
    api.get('/notificaciones', { params: { limit: '10' } })
      .then((res) => setItems(res.data.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  const marcarLeida = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
    setCount((c) => Math.max(0, c - 1))
    try {
      await api.patch(`/notificaciones/${id}/leer`)
    } catch {
      // se corrige solo en el próximo fetchCount/apertura del menú
    }
  }

  const marcarTodasLeidas = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, leida: true })))
    setCount(0)
    try {
      await api.patch('/notificaciones/leer-todas')
    } catch {
      // idem
    }
  }

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground" aria-label="Notificaciones">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs font-bold">
              {count > 9 ? '9+' : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notificaciones</DropdownMenuLabel>
          {items.some((n) => !n.leida) && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={marcarTodasLeidas}>
              <Check className="mr-1 h-3 w-3" /> Marcar todas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length === 0 ? (
          <DropdownMenuItem disabled className="text-center text-muted-foreground">
            No hay notificaciones
          </DropdownMenuItem>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start gap-0.5 whitespace-normal py-2 ${n.leida ? 'opacity-60' : ''}`}
              onClick={() => { if (!n.leida) marcarLeida(n.id) }}
            >
              <span className="text-sm">{n.mensaje}</span>
              <span className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
