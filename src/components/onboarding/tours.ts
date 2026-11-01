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
    description: "Aquí ve un resumen con las cifras clave de su jurisdicción al entrar al sistema: asistencia general, alumnos en riesgo y actividad reciente.",
  },
}

const VIEW_TOUR_HINT_STEP: DriveStep = {
  element: '[data-tour="help-button"]',
  popover: {
    title: "Recorrido de cada pantalla",
    description: "Este botón también tiene un recorrido más corto y específico para la pantalla en la que esté parado — elíjalo cuando quiera entender solo lo que ve ahí, sin repasar todo de nuevo.",
  },
}

const TOURS: Record<Role, DriveStep[]> = {
  [Role.SUPERADMIN]: [
    DASHBOARD_STEP,
    {
      element: '[data-tour="nav-configuracion"]',
      popover: {
        title: "Configuración: la base de todo",
        description: "Primero se crean las Sedes (los núcleos físicos) y los PNF (las carreras); luego se vinculan en Sede-PNF, que es la unidad real de trabajo de un coordinador. Por último se crean los Períodos académicos. Sin esto, nadie más puede empezar a trabajar.",
      },
    },
    {
      element: '[data-tour="nav-usuarios"]',
      popover: {
        title: "Usuarios",
        description: "Cree rectores, coordinadores, docentes y alumnos. Cada rol solo puede crear los roles que tiene permitido, dentro de su propia jurisdicción (su sede, o su sede-PNF).",
      },
    },
    {
      element: '[data-tour="nav-secciones"]',
      popover: {
        title: "Secciones y clases",
        description: "Las Secciones agrupan Clases por trayecto dentro de una sede-PNF; dentro de cada una se crean las Clases (materia, docente, horario) y se matricula a los alumnos, uno por uno o con toda la matrícula completa.",
      },
    },
    {
      element: '[data-tour="nav-matriculas"]',
      popover: {
        title: "Matrículas",
        description: "Muestra las matrículas reales agrupadas por sede-PNF, trayecto y período, solo para visualizarlas. Desde aquí también se corre el asistente de Cierre de Período, que promueve a los alumnos en bloque al trayecto siguiente.",
      },
    },
    {
      element: '[data-tour="nav-reportes"]',
      popover: {
        title: "Reportes",
        description: "Consulte y exporte la asistencia por clase, por alumno o por trayecto completo, y revise quién está por debajo del umbral de asistencia antes de que sea tarde.",
      },
    },
    {
      element: '[data-tour="nav-security-logs"]',
      popover: {
        title: "Seguridad",
        description: "Eventos de seguridad de todo el sistema: intentos de login fallidos, accesos no autorizados y reinicios de dispositivo vinculado.",
      },
    },
    {
      element: '[data-tour="nav-historial"]',
      popover: {
        title: "Historial de deshabilitados",
        description: "Nada se borra de verdad en SIGU: deshabilitar una Sede, Sección, Clase, etc. es un borrado lógico. Aquí ve ese historial completo por tipo de registro, con quién lo deshabilitó y cuándo, y puede exportarlo a Excel. Solo visible para usted.",
      },
    },
    VIEW_TOUR_HINT_STEP,
    HELP_BUTTON_STEP,
  ],
  [Role.RECTOR]: [
    DASHBOARD_STEP,
    {
      element: '[data-tour="nav-usuarios"]',
      popover: {
        title: "Usuarios",
        description: "Cree coordinadores, docentes y alumnos para su sede. Solo verá y administrará gente de su propia sede, nunca de otras.",
      },
    },
    {
      element: '[data-tour="nav-configuracion"]',
      popover: {
        title: "Configuración",
        description: "Puede ofrecer carreras (PNF) nuevas en su sede desde la pestaña Sede-PNF, y crear los Períodos académicos de cada una.",
      },
    },
    {
      element: '[data-tour="nav-secciones"]',
      popover: {
        title: "Secciones y clases",
        description: "Vea las Secciones y Clases de su sede. Puede crear, editar y matricular igual que un coordinador, pero sin restringirse a un solo PNF.",
      },
    },
    {
      element: '[data-tour="nav-reportes"]',
      popover: {
        title: "Reportes",
        description: "Consulte y exporte la asistencia de toda su sede: por clase, por alumno o por trayecto completo.",
      },
    },
    {
      element: '[data-tour="nav-security-logs"]',
      popover: {
        title: "Seguridad",
        description: "Consulte aquí los eventos de seguridad de su sede: intentos fallidos, accesos no autorizados, dispositivos reiniciados.",
      },
    },
    VIEW_TOUR_HINT_STEP,
    HELP_BUTTON_STEP,
  ],
  [Role.COORDINADOR]: [
    DASHBOARD_STEP,
    {
      element: '[data-tour="nav-secciones"]',
      popover: {
        title: "Secciones y clases",
        description: "Aquí crea las secciones, las clases con su horario, y matricula alumnos — individualmente, con toda la matrícula completa, o con una carga masiva desde Excel. Es la pantalla donde pasará más tiempo.",
      },
    },
    {
      element: '[data-tour="nav-unidades"]',
      popover: {
        title: "Unidades Curriculares",
        description: "El catálogo de materias de su trayecto. Una Clase siempre pertenece a una de estas materias.",
      },
    },
    {
      element: '[data-tour="nav-matriculas"]',
      popover: {
        title: "Matrículas",
        description: "Vea las matrículas de sus alumnos agrupadas por trayecto y período. Desde el botón \"Cierre de Período\" los promueve al trayecto siguiente en bloque cuando el período termina.",
      },
    },
    {
      element: '[data-tour="nav-clases-suspendidas"]',
      popover: {
        title: "Clases suspendidas",
        description: "Historial de clases que se suspendieron (feriado, imprevisto) y, si se equivocó, puede anular la suspensión.",
      },
    },
    {
      element: '[data-tour="nav-reportes"]',
      popover: {
        title: "Reportes",
        description: "Consulte y exporte la asistencia por clase, por alumno o por trayecto completo, y vea quién está en riesgo de no alcanzar el umbral de asistencia.",
      },
    },
    VIEW_TOUR_HINT_STEP,
    HELP_BUTTON_STEP,
  ],
  [Role.AUDITOR]: [
    DASHBOARD_STEP,
    {
      element: '[data-tour="nav-reportes"]',
      popover: {
        title: "Reportes",
        description: "Su acceso es de solo lectura, con la misma jurisdicción que tendría si fuera coordinador o rector. Puede consultar y exportar, pero no crear ni editar nada en ninguna pantalla.",
      },
    },
    {
      element: '[data-tour="nav-secciones"]',
      popover: {
        title: "Secciones y clases",
        description: "Puede revisar la estructura de Secciones y Clases, pero los botones de crear/editar/deshabilitar no aparecerán — su rol no los tiene habilitados.",
      },
    },
    {
      element: '[data-tour="nav-security-logs"]',
      popover: {
        title: "Seguridad",
        description: "Consulte aquí los eventos de seguridad dentro de su jurisdicción: intentos fallidos, accesos no autorizados, dispositivos reiniciados. Es solo de lectura.",
      },
    },
    VIEW_TOUR_HINT_STEP,
    HELP_BUTTON_STEP,
  ],
  // DOCENTE entra al panel para ver su resumen y sus Reportes.
  [Role.DOCENTE]: [
    {
      element: '[data-tour="nav-dashboard"]',
      popover: {
        title: "Dashboard",
        description: "Aquí ve el resumen de sus clases: alumnos inscritos, clases de hoy, alumnos en riesgo, inasistencias por justificar y su horario de la semana.",
      },
    },
    {
      element: '[data-tour="nav-reportes"]',
      popover: {
        title: "Reportes",
        description: "Consulte la asistencia de sus propias clases y el historial de los alumnos inscritos en ellas. Puede descargar el Excel de cada reporte y justificar inasistencias.",
      },
    },
    HELP_BUTTON_STEP,
  ],
  // ALUMNO usa la aplicación móvil, no el panel web — no debería llegar aquí,
  // pero se deja un recorrido mínimo por si accede por error.
  [Role.ALUMNO]: [DASHBOARD_STEP, HELP_BUTTON_STEP],
  [Role.VIGILANTE]: [DASHBOARD_STEP, HELP_BUTTON_STEP],
}

export function stepsForRole(role: Role): DriveStep[] {
  return TOURS[role] ?? [DASHBOARD_STEP, HELP_BUTTON_STEP]
}
