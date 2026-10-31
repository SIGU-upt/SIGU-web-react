import axios from 'axios'

export const MENSAJE_DEMASIADOS_INTENTOS = 'Demasiados intentos. Espere un minuto e intente de nuevo.'

export function getErrorMessage(error: unknown, fallback = 'Error de conexión'): string {
  if (axios.isAxiosError(error)) {
    // El API responde con el texto técnico del limitador («ThrottlerException: Too Many Requests»).
    if (error.response?.status === 429) return MENSAJE_DEMASIADOS_INTENTOS
    return error.response?.data?.message ?? error.message ?? fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

export function getErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}
