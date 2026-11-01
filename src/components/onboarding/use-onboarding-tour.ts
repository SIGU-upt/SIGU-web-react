import { useCallback, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { driver, type DriveStep } from "driver.js"
import "driver.js/dist/driver.css"
import { useAuth } from "@/contexts/AuthContext"
import { stepsForRole } from "./tours"
import { stepsForPath } from "./view-tours"

function seenKey(userId: string) {
  return `sigu_tour_visto_${userId}`
}

function viewSeenKey(userId: string, pathname: string) {
  return `sigu_view_tour_visto_${userId}_${pathname}`
}

// Filtra a los pasos cuyo elemento existe ahora mismo en el DOM — en mobile,
// por ejemplo, el contenido de la sidebar vive en un Sheet cerrado por
// defecto, y driver.js revienta si un paso apunta a un selector que no
// matchea nada.
function stepsPresentesEnElDom(steps: DriveStep[]) {
  return steps.filter((step) => !step.element || document.querySelector(step.element as string))
}

function runTour(steps: DriveStep[]) {
  if (steps.length === 0) return
  driver({
    showProgress: true,
    progressText: "{{current}} de {{total}}",
    steps,
    nextBtnText: "Siguiente",
    prevBtnText: "Atrás",
    doneBtnText: "Listo",
  }).drive()
}

/**
 * Tour interactivo por rol (Fase 12 del plan maestro). Se dispara solo una
 * vez por usuario, en el primer login tras esta funcionalidad — la bandera
 * vive en localStorage, no en el servidor, porque es una conveniencia de
 * este navegador, no un dato que haga falta sincronizar entre dispositivos.
 */
export function useOnboardingTour() {
  const { user } = useAuth()
  const location = useLocation()

  const startTour = useCallback(() => {
    if (!user) return
    // El botón de ayuda del top-bar siempre existe, así que un usuario en
    // mobile igual puede repasar el tour abriendo la sidebar primero.
    runTour(stepsPresentesEnElDom(stepsForRole(user.role)))
  }, [user])

  // Recorrido corto de la pantalla actual (ver view-tours.ts) — null si esta
  // vista no tiene uno definido, lo que el top-bar usa para ocultar la opción.
  const viewTourSteps = stepsForPath(location.pathname)
  const startViewTour = useCallback(() => {
    if (!viewTourSteps) return
    runTour(stepsPresentesEnElDom(viewTourSteps))
  }, [viewTourSteps])

  useEffect(() => {
    if (!user) return
    const key = seenKey(user.id)
    try {
      if (localStorage.getItem(key)) return
    } catch {
      // Navegación privada o almacenamiento bloqueado: no hay forma de
      // recordar que ya se mostró, así que se omite el tour automático en
      // vez de mostrarlo en cada carga de página.
      return
    }
    // La bandera se escribe recién cuando el timeout dispara de verdad, no al
    // montar el efecto: en desarrollo, StrictMode monta-desmonta-monta cada
    // efecto una vez, y si la bandera se escribiera aquí, el primer montaje
    // (descartado) ya la dejaría puesta y el segundo montaje (el real) nunca
    // llegaría a mostrar el tour. Además da tiempo a que el layout (sidebar,
    // top-bar) ya esté montado y los selectores `data-tour` existan en el DOM.
    const id = setTimeout(() => {
      try {
        localStorage.setItem(key, "1")
      } catch {
        // visto en el paso anterior: si falla, igual se deja mostrar el tour.
      }
      startTour()
    }, 400)
    return () => clearTimeout(id)
  }, [user, startTour])

  // Recorrido corto por pantalla: se auto-inicia una vez por usuario y por
  // pantalla, pero solo después de que ya vio el tour general — si ambos
  // dispararan en la primera visita se superpondrían dos recorridos seguidos.
  useEffect(() => {
    if (!user || !viewTourSteps) return
    let roleTourVisto = false
    try {
      roleTourVisto = !!localStorage.getItem(seenKey(user.id))
    } catch {
      return
    }
    if (!roleTourVisto) return
    const key = viewSeenKey(user.id, location.pathname)
    try {
      if (localStorage.getItem(key)) return
    } catch {
      return
    }
    const id = setTimeout(() => {
      try {
        localStorage.setItem(key, "1")
      } catch {
        // visto arriba: si falla, igual se deja mostrar el recorrido.
      }
      startViewTour()
    }, 400)
    return () => clearTimeout(id)
  }, [user, location.pathname, viewTourSteps, startViewTour])

  return { startTour, startViewTour, hasViewTour: viewTourSteps !== null }
}
