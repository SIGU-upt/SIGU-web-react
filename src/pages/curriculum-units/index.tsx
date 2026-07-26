import { useState, useCallback, useEffect } from "react"
import { CurriculumUnitsTable } from "@/components/tables/curriculum-units-table"
import { UCFormModal } from "@/components/forms/uc-form-modal"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import api from "@/config/api"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type UnidadCurricular } from "@/types"

export function CurriculumUnitsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState<any>(null)

  const canEdit = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false
  const canDelete = user?.role === Role.SUPERADMIN

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/unidades-curriculares')
      const list = res.data.data ?? res.data
      setData((Array.isArray(list) ? list : []).map((uc: UnidadCurricular) => ({
        id: uc.id,
        code: `UC-${uc.nombre.substring(0, 3).toUpperCase()}`,
        name: uc.nombre,
        trayecto: uc.trayecto?.nombre ?? '—',
        type: 'Obligatoria' as const,
        status: 'Activa' as const,
        _raw: uc,
      })))
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async (formData: any) => {
    await api.post('/unidades-curriculares', formData)
    await fetchData()
  }

  const handleEdit = async (formData: any) => {
    await api.patch(`/unidades-curriculares/${editing._raw.id}`, {
      nombre: formData.nombre,
      trayectoId: formData.trayectoId,
      tramoId: formData.tramoId ?? null,
    })
    await fetchData()
  }

  const handleDelete = async () => {
    if (!deleting) return
    await api.delete(`/unidades-curriculares/${deleting._raw.id}`)
    await fetchData()
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center text-muted-foreground py-10">Cargando...</div>
      ) : (
        <CurriculumUnitsTable
          data={data}
          onCreate={() => { setEditing(null); setModalOpen(true) }}
          onEdit={(item: any) => { setEditing(item); setModalOpen(true) }}
          onDelete={(item: any) => setDeleting(item)}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      <UCFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={editing ? handleEdit : handleCreate}
        initialData={editing ? { nombre: editing.name, trayectoId: editing._raw.trayectoId, tramoId: editing._raw.tramoId ?? undefined } : undefined}
        isEditing={!!editing}
        ucCatalogoId={editing?._raw.ucCatalogoId}
      />

      <ConfirmDeleteModal
        open={!!deleting}
        onOpenChange={(v) => { if (!v) setDeleting(null) }}
        onConfirm={handleDelete}
        title="Eliminar U.C"
        description={`¿Está seguro de eliminar "${deleting?.name}"?`}
      />
    </div>
  )
}
