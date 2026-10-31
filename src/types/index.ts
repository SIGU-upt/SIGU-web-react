export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  RECTOR = 'RECTOR',
  AUDITOR = 'AUDITOR',
  COORDINADOR = 'COORDINADOR',
  DOCENTE = 'DOCENTE',
  ALUMNO = 'ALUMNO',
  VIGILANTE = 'VIGILANTE',
}

export interface User {
  id: string
  nombres: string
  apellidos: string
  nombreCompleto: string
  ci: string
  email: string
  role: Role
  sedeActualId: string | null
  sedeActual?: Sede | null
  sedePnfId: string | null
  sedePnf?: SedePnf | null
  trayectoActualId?: string | null
  trayectoActual?: { id: string; numero: number; nombre: string } | null
  fechaNacimiento: string | null
  createdAt: string
  updatedAt: string
  matriculaActiva?: {
    id: string
    trayecto: { id: string; numero: number; nombre: string }
    periodo: { id: string; nombre: string }
  } | null
  inscripciones?: { id: string; claseId: string }[]
  // Solo presente en la respuesta de POST /users (crear usuario): si el correo
  // de bienvenida no se pudo confirmar enviado, hay que generarle una
  // contraseña temporal a mano (ver ResetPasswordModal).
  emailBienvenidaEnviado?: boolean
}

export interface Sede {
  id: string
  nombre: string
  ubicacion: string
}

export interface Pnf {
  id: string
  nombre: string
  codigo: string
}

export interface SedePnf {
  id: string
  sedeId: string
  pnfId: string
  sede?: Sede
  pnf?: Pnf
}

export interface Trayecto {
  id: string
  pnfId: string
  numero: number
  nombre: string
  pnf?: Pnf
}

export interface Tramo {
  id: string
  trayectoId: string
  numero: number
  isPer: boolean
  fechaInicio: string | null
  fechaFin: string | null
}

// Art. 24(b) del reglamento: Práctica Profesional exige 80% de asistencia, no
// el 75% general de una UC regular — ver `ReportsService.umbralDe()` (backend).
export type TipoUnidadCurricular = 'REGULAR' | 'PRACTICA_PROFESIONAL'

export interface UnidadCurricular {
  id: string
  trayectoId: string
  nombre: string
  // Null en ambos = anual. Mismo valor = un solo tramo. Distintos = rango de
  // tramos consecutivos (ej. Tramo 1 y 2).
  tramoInicioId: string | null
  tramoFinId: string | null
  trayecto?: Trayecto
  tramoInicio?: Tramo | null
  tramoFin?: Tramo | null
  // ADR-023: la UC ahora referencia un catálogo compartido entre trayectos.
  ucCatalogoId?: string
  codigo?: string
  catalogo?: { id: string; codigo: string; nombre: string; tipo?: TipoUnidadCurricular }
}

export interface PeriodoAcademico {
  id: string
  nombre: string
  fechaInicio: string
  fechaFin: string
  sedePnfId: string
  activo: boolean
  advertencias?: string[]
}

export type Turno = "ENTRESEMANA" | "NOCHE" | "FIN_DE_SEMANA"

export interface Seccion {
  id: string
  sedePnfId: string
  trayectoId: string
  codigo: string
  turno?: Turno | null
  sedePnf?: SedePnf
  trayecto?: Trayecto
}

export interface Clase {
  id: string
  ucId: string
  docenteId: string
  seccionId: string
  nombreGrupo: string
  diaSemana: string | null
  horaInicio: string | null
  horaFin: string | null
  aula: string | null
  tramoId: string | null
  unidadCurricular?: UnidadCurricular
  docente?: User
  seccion?: Seccion
  tramo?: Tramo
}

export interface Inscripcion {
  id: string
  alumnoId: string
  claseId: string
  // ADR-025: obligatorio en el backend (antes opcional).
  periodoId: string
  fechaInscripcion: string
  alumno?: User
  clase?: Clase
}

// La matrícula de un alumno: sede-PNF × trayecto × período (28/10/2026: se
// quitó el grupo "Cohorte" con nombre/cupo que existía aparte — no era una
// necesidad real, solo hacía el modelo más confuso de explicar).
export interface AlumnoCohorte {
  id: string
  alumnoId: string
  sedePnfId: string
  trayectoId: string
  periodoId: string
  activa: boolean
  motivoRetiro: string | null
  fechaRetiro: string | null
  alumno?: User
  trayecto?: Trayecto
  periodo?: PeriodoAcademico
  sedePnf?: SedePnf
}

export interface Asistencia {
  id: string
  claseId: string
  alumnoId: string
  fecha: string
  estado: 'PRESENTE' | 'RETARDO' | 'JUSTIFICADO'
  marcadoEn: string | null
}

export interface ClaseSuspendida {
  id: string
  claseId: string
  fecha: string
  motivo: string
  suspendidoPorId: string | null
  clase?: Clase
}

export interface SecurityLog {
  id: string
  userId: string | null
  accion: string
  detalle: string | null
  ipAddress: string | null
  createdAt: string
  user?: User | null
}

// Alumno cuya inscripción viola una regla de matrícula (GET /inscripciones/inconsistencias).
export type TipoInconsistencia = 'MULTIPLE_SECCION' | 'MULTIPLE_GRUPO_MISMA_UC'

export interface InscripcionInconsistencia {
  alumnoId: string
  nombreCompleto: string
  ci: string
  tipo: TipoInconsistencia
  detalle: string
}

// Resultado de POST /unidades-curriculares/replicar: una oferta por trayecto elegido.
export interface ReplicarUcResultado {
  ucCatalogoId: string
  nombre: string
  creadas: { trayectoId: string; unidadCurricularId: string }[]
  omitidos: { trayectoId: string; motivo: string }[]
}

// Respuesta de POST /pnfs/:id/generar-estructura: conteos de lo que se creó.
export interface GenerarEstructuraResultado {
  pnfId: string
  trayectosCreados: number
  tramosCreados: number
}

// Respuesta de POST /periodos/generar: un período por sede-PNF; las que fallan van en omitidos.
export interface GenerarPeriodosResultado {
  creados: { sedePnfId: string; periodoId: string }[]
  omitidos: { sedePnfId: string; motivo: string }[]
  // Avisos no bloqueantes sobre el rango (p. ej. un período activo que empieza en el futuro y deja los reportes en cero).
  advertencias?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  statusCode: number
  message: string
  timestamp: string
  path: string
}
