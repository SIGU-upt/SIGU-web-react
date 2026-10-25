import { useCallback, useEffect } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { useAuth } from "@/contexts/AuthContext"
import { stepsForRole } from "./tours"

function seenKey(userId: string) {
  return `sigu_tour_visto_${userId}`
}

/**
 * Tour interactivo por rol (Fase 12 del plan maestro). Se dispara solo una
 * vez por usuario, en el primer login tras esta funcionalidad — la bandera
 * vive en localStorage, no en el servidor, porque es una conveniencia de
 * este navegador, no un dato que haga falta sincronizar entre dispositivos.
 */
export function useOnboardingTour() {
  const { user } = useAuth()

  const startTour = useCallback(() => {
    if (!user) return
    // En mobile el contenido de la sidebar vive dentro de un Sheet cerrado
    // por defecto (no está en el DOM hasta que se abre) — driver.js no
    // tolera un selector de paso que no matchea nada y revienta al intentar
    // posicionar el popover. Se filtra a los pasos cuyo elemento sí existe
    // ahora mismo; el botón de ayuda del top-bar siempre existe, así que un
    // usuario en mobile igual puede repasar el tour abriendo la sidebar primero.
    const steps = stepsForRole(user.role).filter(
      (step) => !step.element || document.querySelector(step.element as string),
    )
    if (steps.length === 0) return
    driver({
      showProgress: true,
      steps,
      nextBtnText: "Siguiente",
      prevBtnText: "Atrás",
      doneBtnText: "Listo",
    }).drive()
  }, [user])

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

  return { startTour }
}
