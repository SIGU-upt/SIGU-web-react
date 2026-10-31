import { useState, useCallback, useEffect } from "react"
import { CurriculumUnitsTable } from "@/components/tables/curriculum-units-table"
import { UCFormModal } from "@/components/forms/uc-form-modal"
import { ReplicarUcModal } from "@/components/forms/replicar-uc-modal"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import api from "@/config/api"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type UnidadCurricular } from "@/types"

// Fila de la tabla; `_raw` conserva la UC original para editar y eliminar.
interface UcRow {
  id: string
  code: string
  name: string
  trayecto: string
  pnf: string
  // Art. 24(b): la Práctica Profesional exige 80% de asistencia, no el 75%
  // general — es la única clasificación real que existe hoy para una UC. No
  // hay distinción "obligatoria/electiva" en el modelo (comentario de Vercel
  // en /unidades: ese valor estaba siempre fijo en "Obligatoria", sin
  // provenir de ningún dato real).
  type: 'Regular' | 'Práctica Profesional'
  _raw: UnidadCurricular
}

// Datos que entrega el formulario de UC (ver UCFormModal).
interface UcFormValues {
  nombre: string
  trayectoId: string
  tramoId?: string
  tipo?: 'REGULAR' | 'PRACTICA_PROFESIONAL'
  ucCatalogoIdSeleccionado?: string
}

export function CurriculumUnitsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<UcRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UcRow | null>(null)
  const [deleting, setDeleting] = useState<UcRow | null>(null)
  const [replicating, setReplicating] = useState<UcRow | null>(null)

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
        pnf: uc.trayecto?.pnf?.nombre ?? '—',
        type: uc.catalogo?.tipo === 'PRACTICA_PROFESIONAL' ? 'Práctica Profesional' as const : 'Regular' as const,
        _raw: uc,
      })))
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async (formData: UcFormValues) => {
    const { ucCatalogoIdSeleccionado, nombre, tipo, ...rest } = formData
    await api.post('/unidades-curriculares', ucCatalogoIdSeleccionado
      ? { ...rest, ucCatalogoId: ucCatalogoIdSeleccionado }
      : { ...rest, nombre, tipo })
    await fetchData()
  }

  const handleEdit = async (formData: UcFormValues) => {
    if (!editing) return
    await api.patch(`/unidades-curriculares/${editing._raw.id}`, {
      nombre: formData.nombre,
      trayectoId: formData.trayectoId,
      tramoId: formData.tramoId ?? null,
      tipo: formData.tipo,
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
          onEdit={(item) => { setEditing(item); setModalOpen(true) }}
          onReplicate={(item) => setReplicating(item)}
          onDelete={(item) => setDeleting(item)}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      <UCFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={editing ? handleEdit : handleCreate}
        initialData={editing ? { nombre: editing.name, trayectoId: editing._raw.trayectoId, tramoId: editing._raw.tramoId ?? undefined, tipo: editing._raw.catalogo?.tipo } : undefined}
        isEditing={!!editing}
        ucCatalogoId={editing?._raw.ucCatalogoId}
      />

      <ReplicarUcModal
        open={!!replicating}
        onOpenChange={(v) => { if (!v) setReplicating(null) }}
        uc={replicating?._raw ?? null}
        onDone={fetchData}
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
