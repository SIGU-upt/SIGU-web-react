import { useState, useCallback, useEffect } from "react"
import { ProfessorsTable } from "@/components/tables/professors-table"
import { UserFormModal } from "@/components/forms/user-form-modal"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import api from "@/config/api"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type User } from "@/types"

export function ProfessorsPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deletingUser, setDeletingUser] = useState<any>(null)

  const canEdit = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, string> = { role: 'DOCENTE' }
      if (user?.sedeActualId) params.sedeId = user.sedeActualId
      const res = await api.get('/users', { params })
      const list = res.data.data ?? res.data
      setUsers((Array.isArray(list) ? list : []).map((u: User) => ({
        id: u.id,
        name: u.nombreCompleto,
        initials: (u.nombres?.charAt(0) ?? '') + (u.apellidos?.charAt(0) ?? ''),
        idNumber: u.ci,
        email: u.email,
        subjects: [],
        status: 'Activo',
      })))
    } catch { setUsers([]) }
    finally { setLoading(false) }
  }, [user?.sedeActualId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async (data: any) => {
    await api.post('/users', { ...data, role: 'DOCENTE' })
    await fetchData()
  }

  const handleEdit = async (data: any) => {
    const payload: any = {}
    if (data.nombres) payload.nombres = data.nombres
    if (data.apellidos) payload.apellidos = data.apellidos
    if (data.email) payload.email = data.email
    await api.patch(`/users/${editingUser.id}`, payload)
    await fetchData()
  }

  const handleDelete = async () => {
    if (!deletingUser) return
    await api.delete(`/users/${deletingUser.id}`)
    await fetchData()
  }

  const handleImport = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/import/inscripciones', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    await fetchData()
    return res.data
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center text-muted-foreground py-10">Cargando docentes...</div>
      ) : (
        <ProfessorsTable
          data={users}
          onImport={handleImport}
          onCreate={() => { setEditingUser(null); setModalOpen(true) }}
          onEdit={(item) => { setEditingUser(item); setModalOpen(true) }}
          onDelete={(item) => setDeletingUser(item)}
          canEdit={canEdit}
        />
      )}

      <UserFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={editingUser ? handleEdit : handleCreate}
        defaultRole={Role.DOCENTE}
        initialData={editingUser ? { nombres: editingUser.name?.split(' ')[0], apellidos: editingUser.name?.split(' ').slice(1).join(' '), ci: editingUser.idNumber, email: editingUser.email } : undefined}
        isEditing={!!editingUser}
      />

      <ConfirmDeleteModal
        open={!!deletingUser}
        onOpenChange={(v) => { if (!v) setDeletingUser(null) }}
        onConfirm={handleDelete}
        title="Eliminar Docente"
        description={`¿Está seguro de eliminar a ${deletingUser?.name}?`}
      />
    </div>
  )
}
