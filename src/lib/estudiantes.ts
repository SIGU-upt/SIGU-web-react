import { toast } from "sonner"
import api from "@/config/api"
import { getErrorStatus } from "@/lib/errors"
import { avisarSiCorreoBienvenidaFallo } from "@/lib/avisos-correo"
import type { UserFormData } from "@/components/forms/user-form-modal"

/**
 * Crea un estudiante (POST /users) y, si trae trayecto, lo matricula en el período
 * activo de su sede-PNF (POST /matriculas). Lo usan la pantalla de Estudiantes y el
 * Dashboard para que el alumno quede igual venga de donde venga.
 *
 * El formulario llama `trayectoId` al campo, pero el API espera `trayectoActualId`
 * (con `trayectoId` rechaza el POST). Esa asignación inicial solo existe en la
 * creación (ADR-025 la retira de PATCH); el POST /matriculas es el que de verdad
 * matricula al alumno y sincroniza ese mismo campo del lado del servidor.
 */
export async function crearEstudiante(data: UserFormData, sedePnfIdPorDefecto?: string | null) {
  const { trayectoId, ...userData } = data
  const res = await api.post('/users', { ...userData, role: 'ALUMNO', trayectoActualId: trayectoId || undefined })
  avisarSiCorreoBienvenidaFallo(res.data)
  const sedePnfId = data.sedePnfId ?? sedePnfIdPorDefecto
  if (trayectoId && sedePnfId) {
    try {
      const periodoRes = await api.get('/periodos/activo', { params: { sedePnfId } })
      const periodo = periodoRes.data
      await api.post('/matriculas', {
        alumnoId: res.data.id,
        sedePnfId,
        trayectoId,
        periodoId: periodo.id,
      })
    } catch (err) {
      if (getErrorStatus(err) === 404) {
        // El trayecto ya quedó asignado al alumno; lo que falta es la
        // matrícula en un período, que necesita un período activo.
        toast.warning('El estudiante se creó con su trayecto asignado, pero no hay un período académico activo para esa sede-PNF, así que aún no quedó matriculado en un período. Cree un período activo para matricularlo.')
      } else {
        toast.warning('El estudiante se creó con su trayecto asignado, pero no fue posible matricularlo en el período. Puede hacerlo luego.')
      }
    }
  }
  return res.data
}
