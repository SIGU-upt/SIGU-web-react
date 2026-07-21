import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { StudentsTable } from "@/components/tables/students-table"
import { UserFormModal } from "@/components/forms/user-form-modal"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import api from "@/config/api"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type User, type Trayecto } from "@/types"

export function StudentsPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deletingUser, setDeletingUser] = useState<any>(null)
  const [resettingDeviceUser, setResettingDeviceUser] = useState<any>(null)
  const [trayectoOptions, setTrayectoOptions] = useState<Trayecto[]>([])
  const [trayectoFilter, setTrayectoFilter] = useState("")

  const canEdit = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false
  const canResetDevice = canEdit
  const canDelete = user?.role === Role.SUPERADMIN

  useEffect(() => {
    api.get('/trayectos').then((res) => {
      const list = res.data.data ?? res.data
      setTrayectoOptions(Array.isArray(list) ? list : [])
    }).catch(() => setTrayectoOptions([]))
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, string> = { role: 'ALUMNO', limit: '1000' }
      if (user?.sedeActualId) params.sedeId = user.sedeActualId
      if (user?.sedePnfId) params.sedePnfId = user.sedePnfId
      if (trayectoFilter) params.trayectoId = trayectoFilter
      const res = await api.get('/users', { params })
      const list = res.data.data ?? res.data
      setUsers((Array.isArray(list) ? list : []).map((u: User & { cohorteActiva?: any }) => ({
        id: u.id,
        name: u.nombreCompleto,
        initials: (u.nombres?.charAt(0) ?? '') + (u.apellidos?.charAt(0) ?? ''),
        idNumber: u.ci,
        email: u.email,
        sedePnfId: u.sedePnfId,
        career: u.sedePnf?.pnf?.nombre ?? '—',
        semester: u.cohorteActiva?.trayecto?.numero ?? 0,
        status: 'Regular',
      })))
    } catch { setUsers([]) }
    finally { setLoading(false) }
  }, [user?.sedeActualId, user?.sedePnfId, trayectoFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async (data: any) => {
    const { trayectoId, ...userData } = data
    const res = await api.post('/users', { ...userData, role: 'ALUMNO' })
    const sedePnfId = data.sedePnfId ?? user?.sedePnfId
    if (trayectoId && sedePnfId) {
      try {
        const periodosRes = await api.get('/periodos/activo', { params: { sedePnfId } })
        const periodosList = periodosRes.data.data ?? periodosRes.data
        const periodos = Array.isArray(periodosList) ? periodosList : (periodosList ? [periodosList] : [])
        if (periodos[0]) {
          await api.post('/cohortes', {
            alumnoId: res.data.id,
            sedePnfId,
            trayectoId,
            periodoId: periodos[0].id,
          })
        }
      } catch {
        // El alumno se creó igual; la cohorte se puede asignar después.
      }
    }
    await fetchData()
  }

  const handleEdit = async (data: any) => {
    const payload: any = {}
    if (data.nombres) payload.nombres = data.nombres
    if (data.apellidos) payload.apellidos = data.apellidos
    if (data.email) payload.email = data.email
    if (data.sedePnfId) payload.sedePnfId = data.sedePnfId
    await api.patch(`/users/${editingUser.id}`, payload)
    await fetchData()
  }

  const handleDelete = async () => {
    if (!deletingUser) return
    await api.delete(`/users/${deletingUser.id}`)
    await fetchData()
  }

  const handleResetDevice = async () => {
    if (!resettingDeviceUser) return
    await api.patch(`/users/${resettingDeviceUser.id}/reset-device`)
    toast.success(`Dispositivo de ${resettingDeviceUser.name} reiniciado correctamente.`)
  }

  const handleImport = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/import/inscripciones', formData, {
      params: { role: 'ALUMNO' },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    await fetchData()
    return res.data
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center text-muted-foreground py-10">Cargando estudiantes...</div>
      ) : (
        <StudentsTable
          data={users}
          onImport={handleImport}
          onCreate={() => { setEditingUser(null); setModalOpen(true) }}
          onEdit={(item) => { setEditingUser(item); setModalOpen(true) }}
          onDelete={(item) => setDeletingUser(item)}
          onResetDevice={(item) => setResettingDeviceUser(item)}
          canEdit={canEdit}
          canResetDevice={canResetDevice}
          canDelete={canDelete}
          trayectoOptions={trayectoOptions}
          trayectoFilter={trayectoFilter}
          onTrayectoFilterChange={setTrayectoFilter}
        />
      )}

      <UserFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={editingUser ? handleEdit : handleCreate}
        defaultRole={Role.ALUMNO}
        initialData={editingUser ? { nombres: editingUser.name?.split(' ')[0], apellidos: editingUser.name?.split(' ').slice(1).join(' '), ci: editingUser.idNumber, email: editingUser.email, sedePnfId: editingUser.sedePnfId } : undefined}
        isEditing={!!editingUser}
      />

      <ConfirmDeleteModal
        open={!!deletingUser}
        onOpenChange={(v) => { if (!v) setDeletingUser(null) }}
        onConfirm={handleDelete}
        title="Eliminar Estudiante"
        description={`¿Está seguro de eliminar a ${deletingUser?.name}?`}
      />

      <ConfirmDeleteModal
        open={!!resettingDeviceUser}
        onOpenChange={(v) => { if (!v) setResettingDeviceUser(null) }}
        onConfirm={handleResetDevice}
        title="Reiniciar dispositivo"
        description={`Esto permitirá que ${resettingDeviceUser?.name} vuelva a iniciar sesión desde un nuevo dispositivo. ¿Desea continuar?`}
        confirmLabel="Reiniciar"
        loadingLabel="Reiniciando..."
      />
    </div>
  )
}
