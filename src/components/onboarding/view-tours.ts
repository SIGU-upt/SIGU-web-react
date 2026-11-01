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
    prefix: "/dashboard",
    steps: [
      {
        element: '[data-tour="dashboard-stats"]',
        popover: {
          title: "Cifras de su jurisdicción",
          description: "Estos números ya están acotados a su alcance: sede para Rector, sede-PNF para Coordinador. El badge junto al título indica a qué ámbito corresponden, para no confundirlos con el total del sistema.",
        },
      },
      {
        element: '[data-tour="dashboard-graficos"]',
        popover: {
          title: "Distribución docentes/alumnos",
          description: "Compara la proporción de personal académico frente a estudiantes matriculados, útil para detectar sedes o PNF con poca cobertura docente.",
        },
      },
      {
        element: '[data-tour="dashboard-asistencia-baja"]',
        popover: {
          title: "Alumnos con menor asistencia",
          description: "Lista a quienes están más cerca de quedar por debajo del umbral institucional (75%, o 80% en Práctica Profesional), para actuar antes de que pierdan la materia por inasistencia.",
        },
      },
    ],
  },
  {
    prefix: "/unidades",
    steps: [
      {
        element: '[data-tour="unidades-filtros"]',
        popover: {
          title: "Buscar y acotar por trayecto",
          description: "Busque una U.C. por código o nombre, y filtre por trayecto cuando el PNF tenga varios — útil antes de crear una nueva, para confirmar que no existe ya una equivalente.",
        },
      },
      {
        element: '[data-tour="unidades-acciones"]',
        popover: {
          title: "Exportar pensum y crear U.C.",
          description: "\"Exportar Pensum\" descarga el catálogo completo a Excel. \"Nueva U.C\" la da de alta asociada a un trayecto y, si corresponde, a un rango de tramos consecutivos (no solo uno).",
        },
      },
    ],
  },
  {
    prefix: "/security-logs",
    steps: [
      {
        element: '[data-tour="security-logs-filtros"]',
        popover: {
          title: "Filtrar eventos",
          description: "Busque por usuario o detalle, acote por tipo de acción (ej. intentos de login fallidos, cambios de contraseña, registros de asistencia) y por rango de fechas.",
        },
      },
      {
        element: '[data-tour="security-logs-tabla"]',
        popover: {
          title: "Auditoría de seguridad",
          description: "Cada fila es un evento sensible registrado automáticamente por el sistema (no editable), útil para investigar accesos indebidos o incidencias de asistencia reportadas por un docente.",
        },
      },
    ],
  },
  {
    prefix: "/clases-suspendidas",
    steps: [
      {
        element: '[data-tour="clases-suspendidas-filtros"]',
        popover: {
          title: "Filtrar suspensiones",
          description: "Acote por fecha, sección o docente para encontrar una suspensión puntual — útil para resolver reclamos de alumnos sobre una clase que no se dictó.",
        },
      },
      {
        element: '[data-tour="clases-suspendidas-tabla"]',
        popover: {
          title: "Historial de suspensiones",
          description: "Registra cuándo una clase programada no se dictó y por qué. Anular una suspensión la elimina del historial; hágalo solo si se registró por error.",
        },
      },
    ],
  },
  {
    prefix: "/perfil",
    steps: [
      {
        element: '[data-tour="perfil-mis-datos"]',
        popover: {
          title: "Sus datos",
          description: "Nombre, cédula, correo, rol y la sede/PNF a la que está asignado. Si algún dato está incorrecto, repórtelo a quien administra el sistema — no es editable desde aquí.",
        },
      },
      {
        element: '[data-tour="perfil-cambiar-password"]',
        popover: {
          title: "Cambiar su contraseña",
          description: "Requiere la contraseña actual. Si inició sesión con una contraseña temporal, este formulario queda abierto de forma obligatoria hasta que la cambie.",
        },
      },
    ],
  },
  {
    prefix: "/historial",
    steps: [
      {
        element: '[data-tour="historial-filtros"]',
        popover: {
          title: "Elegir qué historial ver",
          description: "Cada tipo de registro (Sedes, Secciones, Clases, Usuarios...) tiene su propia lista — cámbielo aquí. El rango de fechas filtra por cuándo se deshabilitó, no por cuándo se creó el registro.",
        },
      },
      {
        element: '[data-tour="historial-tabla"]',
        popover: {
          title: "Qué significa cada columna",
          description: "\"Descripción\" arma un resumen legible del registro (con sus relaciones, ej. la materia y el docente de una Clase) para no tener que adivinar qué era por su sola id. Si no conoce a quién deshabilitó un registro, probablemente ese usuario también está deshabilitado.",
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
