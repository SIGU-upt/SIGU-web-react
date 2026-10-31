import { useRef } from 'react'

type EventoFoco = Event & { preventDefault: () => void; defaultPrevented: boolean }

/**
 * Devuelve el foco al elemento que lo tenía antes de abrir un diálogo.
 * Radix solo lo restaura cuando el diálogo se abre con un `Trigger`; aquí casi todos se abren
 * por estado (un botón cambia un `useState`), así que el foco se quedaba en el `body` al cerrar.
 */
export function useRestaurarFoco(opciones: {
  onOpenAutoFocus?: (e: Event) => void
  onCloseAutoFocus?: (e: Event) => void
}) {
  const previo = useRef<HTMLElement | null>(null)

  return {
    onOpenAutoFocus: (e: Event) => {
      previo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      opciones.onOpenAutoFocus?.(e)
    },
    onCloseAutoFocus: (e: Event) => {
      opciones.onCloseAutoFocus?.(e)
      if ((e as EventoFoco).defaultPrevented) return
      const anterior = previo.current
      previo.current = null
      if (anterior && anterior !== document.body && anterior.isConnected) {
        e.preventDefault()
        anterior.focus()
      }
    },
  }
}
