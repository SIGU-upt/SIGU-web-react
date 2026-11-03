import { Role } from "@/types"

// Roles que de verdad navegan PNFs/Sedes/Secciones/Usuarios — DOCENTE y
// ALUMNO tienen una superficie mucho más chica y no necesitan el buscador
// global. Compartido entre GlobalSearch y el botón visible del top-bar.
export const ROLES_CON_BUSCADOR = [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR, Role.AUDITOR]
