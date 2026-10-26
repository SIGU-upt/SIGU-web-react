// Cuentas de prueba deterministas creadas por SIGU-api-nest/scripts/seed-completo.ts
// (y el SUPERADMIN por scripts/seed.ts) — mismas contraseñas fijas que ya están
// en esos scripts, dentro del propio repo. No son cuentas ni datos reales de
// producción aunque vivan en la misma base compartida de `dev`.
export const CREDENTIALS = {
  superadmin: { ci: 'V-00000001', password: 'Admin123!' },
  rector: { ci: 'V-11111111', password: 'Rector123!' },
  coordinador: { ci: 'V-22222222', password: 'Coord123!' },
  docente: { ci: 'V-33333333', password: 'Docente123!' },
  alumno: { ci: 'V-44444444', password: 'Alumno123!' },
} as const
