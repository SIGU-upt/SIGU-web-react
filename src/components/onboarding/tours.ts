import { Role } from "@/types"
import type { DriveStep } from "driver.js"

// Pasos del tour por rol, en orden. `element` es un selector CSS — los nav
// items de la barra lateral llevan `data-tour="nav-<id>"` (ver sidebar.tsx) y
// `help-button` es el botón de ayuda del top-bar (ver top-bar.tsx), común a
// todos los roles, para que sepan cómo volver a abrir el tour.
const HELP_BUTTON_STEP: DriveStep = {
  element: '[data-tour="help-button"]',
  popover: {
    title: "¿Necesita repasar esto?",
    description: "Puede volver a abrir este recorrido cuando quiera desde este botón de ayuda.",
  },
}

const DASHBOARD_STEP: DriveStep = {
  element: '[data-tour="nav-dashboard"]',
  popover: {
    title: "Dashboard",
    description: "Aquí ve un resumen con las cifras clave de su jurisdicción al entrar al sistema.",
  },
}

const TOURS: Record<Role, DriveStep[]> = {
  [Role.SUPERADMIN]: [
    DASHBOARD_STEP,
    {
      element: '[data-tour="nav-configuracion"]',
      popover: {
        title: "Configuración",
        description: "Desde aquí crea sedes, PNF (carreras) y los vincula entre sí. Es el punto de partida antes de que un coordinador pueda trabajar.",
      },
    },
    {
      element: '[data-tour="nav-usuarios"]',
      popover: {
        title: "Usuarios",
        description: "Cree rectores, coordinadores, docentes y alumnos. Cada rol solo puede crear los roles que tiene permitido, dentro de su propia jurisdicción.",
      },
    },
    {
      element: '[data-tour="nav-secciones"]',
      popover: {
        title: "Secciones y clases",
        description: "Las secciones agrupan clases; dentro de cada una se crean las clases (materia, docente, horario) y se matricula a los alumnos.",
      },
    },
    HELP_BUTTON_STEP,
  ],
  [Role.RECTOR]: [
    DASHBOARD_STEP,
    {
      element: '[data-tour="nav-usuarios"]',
      popover: {
        title: "Usuarios",
        description: "Cree coordinadores, docentes y alumnos para su sede. Solo verá y administrará gente de su propia sede.",
      },
    },
    {
      element: '[data-tour="nav-configuracion"]',
      popover: {
        title: "Configuración",
        description: "Puede ofrecer carreras (PNF) nuevas en su sede desde la pestaña Sede-PNF.",
      },
    },
    {
      element: '[data-tour="nav-security-logs"]',
      popover: {
        title: "Seguridad",
        description: "Consulte aquí los eventos de seguridad de su sede: intentos fallidos, accesos no autorizados, dispositivos reiniciados.",
      },
    },
    HELP_BUTTON_STEP,
  ],
  [Role.COORDINADOR]: [
    DASHBOARD_STEP,
    {
      element: '[data-tour="nav-secciones"]',
      popover: {
        title: "Secciones y clases",
        description: "Aquí crea las secciones, las clases con su horario, y matricula alumnos — individualmente, por cohorte completa, o con una carga masiva desde Excel.",
      },
    },
    {
      element: '[data-tour="nav-cohortes"]',
      popover: {
        title: "Cohortes",
        description: "Agrupa a los alumnos que entraron juntos a un trayecto. Desde aquí los promueve al trayecto siguiente en bloque.",
      },
    },
    {
      element: '[data-tour="nav-reportes"]',
      popover: {
        title: "Reportes",
        description: "Consulte y exporte la asistencia por clase, por alumno o por trayecto completo.",
      },
    },
    HELP_BUTTON_STEP,
  ],
  [Role.AUDITOR]: [
    DASHBOARD_STEP,
    {
      element: '[data-tour="nav-reportes"]',
      popover: {
        title: "Reportes",
        description: "Su acceso es de solo lectura, con la misma jurisdicción que tendría si fuera coordinador o rector. Puede consultar y exportar, pero no crear ni editar nada.",
      },
    },
    HELP_BUTTON_STEP,
  ],
  // DOCENTE y ALUMNO usan la aplicación móvil, no el panel web — no deberían
  // llegar aquí, pero se deja un recorrido mínimo por si acceden por error.
  [Role.DOCENTE]: [DASHBOARD_STEP, HELP_BUTTON_STEP],
  [Role.ALUMNO]: [DASHBOARD_STEP, HELP_BUTTON_STEP],
  [Role.VIGILANTE]: [DASHBOARD_STEP, HELP_BUTTON_STEP],
}

export function stepsForRole(role: Role): DriveStep[] {
  return TOURS[role] ?? [DASHBOARD_STEP, HELP_BUTTON_STEP]
}
