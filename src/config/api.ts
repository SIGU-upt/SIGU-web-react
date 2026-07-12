import axios from 'axios'
import { toast } from 'sonner'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sigu_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sigu_token')
      localStorage.removeItem('sigu_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    const message =
      err.response?.data?.message ||
      (err.response?.status === 403
        ? 'No tiene permisos para realizar esta accion'
        : err.response?.status === 404
          ? 'Recurso no encontrado'
          : err.response?.status === 409
            ? 'Conflicto: el recurso ya existe'
            : 'Error de conexion con el servidor')

    toast.error(message)
    return Promise.reject(err)
  },
)

export default api
