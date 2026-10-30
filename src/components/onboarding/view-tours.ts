import type { DriveStep } from "driver.js"

// Recorridos cortos y específicos por vista, aparte del recorrido general por
// rol (ver tours.ts). Se buscan por el prefijo de la ruta actual (la primera
// coincidencia gana, así que una ruta más específica como "/secciones/" debe
// ir antes que una más genérica si alguna vez lo fueran prefijo una de otra).
// Cada paso usa un selector `data-tour="..."` puesto a mano en el elemento
// real de esa pantalla — si la vista cambia su estructura, hay que revisar
// aquí también.
const VIEW_TOURS: { prefix: string; steps: DriveStep[] }[] = [
  {
    prefix: "/secciones/",
    steps: [
      {
        element: '[data-tour="seccion-agregar-clase"]',
        popover: {
          title: "Agregar Clase",
          description: "Cada Clase es un grupo de una materia: elige la materia, el docente, el horario y el aula. Una materia puede tener varios grupos (Clases) distintos dentro de la misma Sección.",
        },
      },
      {
        element: '[data-tour="seccion-inscribir-individual"]',
        popover: {
          title: "Inscribir alumnos (uno por uno)",
          description: "Úselo para matricular alumnos en una materia con varios grupos (hay que elegir cuál), o para un alumno que viene de otro trayecto por una materia que se le quedó pendiente.",
        },
      },
      {
        element: '[data-tour="seccion-inscribir-matricula"]',
        popover: {
          title: "Inscribir matrícula completa",
          description: "Matricula de una vez a todos los alumnos de esta matrícula en las materias que tienen un solo grupo. Las materias con varios grupos quedan afuera: use \"Inscribir alumnos\" para esas.",
        },
      },
      {
        element: '[data-tour="seccion-matricula"]',
        popover: {
          title: "Alumnos de esta matrícula",
          description: "Son los alumnos cuyo trayecto oficial actual coincide con esta Sección. La columna Estado indica si ya están inscritos en las clases, no si pertenecen a esta matrícula (eso es distinto).",
        },
      },
    ],
  },
  {
    prefix: "/secciones",
    steps: [
      {
        element: '[data-tour="secciones-crear"]',
        popover: {
          title: "Nueva Sección",
          description: "Una Sección agrupa las Clases de un trayecto dentro de una sede-PNF. Créela antes de poder agregar Clases.",
        },
      },
      {
        element: '[data-tour="secciones-filtros"]',
        popover: {
          title: "Filtros",
          description: "Acote por sede, PNF (global, sin repetirse por sede) y trayecto antes de buscar una Sección puntual.",
        },
      },
      {
        element: '[data-tour="secciones-tabla"]',
        popover: {
          title: "Lista de Secciones",
          description: "Están agrupadas por Sede → PNF para no confundir códigos repetidos entre sedes. Haga clic en una fila para entrar al detalle y gestionar sus Clases.",
        },
      },
    ],
  },
  {
    prefix: "/docentes",
    steps: [
      {
        element: '[data-tour="docentes-filtros"]',
        popover: {
          title: "Buscar y filtrar docentes",
          description: "Busque por nombre, cédula o correo, y acote por sede/PNF si su rol lo permite.",
        },
      },
      {
        element: '[data-tour="docentes-acciones"]',
        popover: {
          title: "Exportar, importar y crear",
          description: "Exporte el listado a Excel, cargue varios docentes de una vez desde una plantilla, o cree uno nuevo manualmente.",
        },
      },
    ],
  },
  {
    prefix: "/estudiantes",
    steps: [
      {
        element: '[data-tour="estudiantes-filtros"]',
        popover: {
          title: "Buscar y filtrar estudiantes",
          description: "Busque por nombre, cédula o correo, y acote por sede, PNF y trayecto.",
        },
      },
      {
        element: '[data-tour="estudiantes-acciones"]',
        popover: {
          title: "Exportar, importar y crear",
          description: "Exporte el listado a Excel, cargue varios estudiantes de una vez desde una plantilla (incluye su trayecto y clases), o cree uno nuevo manualmente.",
        },
      },
    ],
  },
  {
    prefix: "/personal-administrativo",
    steps: [
      {
        element: '[data-tour="personal-filtros"]',
        popover: {
          title: "Buscar y filtrar",
          description: "Busque por nombre, cédula o correo, y acote por sede o PNF si su rol lo permite. Cada rol ve solo el personal que le corresponde gestionar.",
        },
      },
      {
        element: '[data-tour="personal-nuevo"]',
        popover: {
          title: "Crear personal",
          description: "Agregue un rector, coordinador o auditor nuevo. Un rector solo puede crear coordinadores y auditores de su sede.",
        },
      },
    ],
  },
  {
    prefix: "/configuracion",
    steps: [
      {
        element: '[data-tour="config-tabs"]',
        popover: {
          title: "Estructura académica",
          description: "Sedes, PNF (carreras), su combinación Sede-PNF y los Períodos académicos se crean y editan aquí. Es la base que necesita existir antes de dar de alta Secciones y Clases.",
        },
      },
    ],
  },
  {
    prefix: "/reportes",
    steps: [
      {
        element: '[data-tour="reportes-tabs"]',
        popover: {
          title: "Tipos de reporte",
          description: "Consulte la asistencia por Clase, por Alumno individual, por Trayecto completo, o vea quiénes están en riesgo de no alcanzar el 75% de asistencia (80% en Práctica Profesional).",
        },
      },
    ],
  },
  {
    prefix: "/matriculas",
    steps: [
      {
        element: '[data-tour="matriculas-cierre-periodo"]',
        popover: {
          title: "Cierre de Período",
          description: "Asistente para promover en bloque a los alumnos de un período al trayecto siguiente, cuando el período académico termina.",
        },
      },
      {
        element: '[data-tour="matriculas-tabla"]',
        popover: {
          title: "Matrículas agrupadas",
          description: "Las matrículas reales de cada alumno (sede-PNF × trayecto × período), agrupadas solo para visualizarlas. Expanda un grupo para ver y, si corresponde, retirar alumnos individuales.",
        },
      },
    ],
  },
]

export function stepsForPath(pathname: string): DriveStep[] | null {
  const match = VIEW_TOURS.find((v) => pathname.startsWith(v.prefix))
  return match ? match.steps : null
}
