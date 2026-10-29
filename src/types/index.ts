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
  sedePnfId: string | null
  sedePnf?: SedePnf | null
  trayectoActualId?: string | null
  trayectoActual?: { id: string; numero: number; nombre: string } | null
  fechaNacimiento: string | null
  createdAt: string
  updatedAt: string
  cohorteActiva?: {
    id: string
    trayecto: { id: string; numero: number; nombre: string }
    periodo: { id: string; nombre: string }
  } | null
  inscripciones?: { id: string; claseId: string }[]
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
  tramoId: string | null
  trayecto?: Trayecto
  tramo?: Tramo | null
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

export type Turno = "MANANA" | "TARDE" | "NOCHE" | "FIN_DE_SEMANA"

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

// Resultado de POST /unidades-curriculares/replicar: una oferta por trayecto elegido.
export interface ReplicarUcResultado {
  ucCatalogoId: string
  nombre: string
  creadas: { trayectoId: string; unidadCurricularId: string }[]
  omitidos: { trayectoId: string; motivo: string }[]
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
