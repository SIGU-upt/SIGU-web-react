import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { ProfessorsTable } from "@/components/tables/professors-table"
import { UserFormModal } from "@/components/forms/user-form-modal"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import api from "@/config/api"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type User, type SedePnf } from "@/types"

export function ProfessorsPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deletingUser, setDeletingUser] = useState<any>(null)
  const [resettingDeviceUser, setResettingDeviceUser] = useState<any>(null)
  const [sedePnfOptions, setSedePnfOptions] = useState<SedePnf[]>([])
  const [sedeFilter, setSedeFilter] = useState("")
  const [pnfFilter, setPnfFilter] = useState("") // guarda un sedePnfId
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  // Igual que en Estudiantes: superadmin/auditor tienen alcance global (necesitan
  // sede + PNF para acotar), rector ya viene escopado a su sede por el backend
  // (solo elige PNF dentro de ella), coordinador ya está en una sola sede-PNF.
  const isUnscoped = user?.role === Role.SUPERADMIN || user?.role === Role.AUDITOR
  const isRector = user?.role === Role.RECTOR
  const canEdit = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false
  const canResetDevice = canEdit
  const canDelete = user?.role === Role.SUPERADMIN

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    api.get('/sede-pnf').then((res) => {
      const list = res.data.data ?? res.data
      setSedePnfOptions(Array.isArray(list) ? list : [])
    }).catch(() => setSedePnfOptions([]))
  }, [])

  // Opciones de sede (solo superadmin/auditor): sedes únicas derivadas de las sede-PNF.
  const sedeOptions = isUnscoped
    ? Array.from(new Map(sedePnfOptions.map((sp) => [sp.sedeId, sp.sede?.nombre ?? sp.sedeId])).entries())
        .map(([id, label]) => ({ id, label }))
    : undefined

  // Opciones de PNF: para superadmin/auditor se limitan a la sede elegida; para
  // rector, el servidor ya devuelve solo las sede-PNF de su propia sede.
  const pnfOptions =
    isUnscoped || isRector
      ? sedePnfOptions
          .filter((sp) => !isUnscoped || !sedeFilter || sp.sedeId === sedeFilter)
          .map((sp) => ({ id: sp.id, label: sp.pnf?.nombre ?? sp.id }))
      : undefined

  const handleSedeFilterChange = (value: string) => {
    setSedeFilter(value)
    setPnfFilter("")
    setPage(1)
  }
  const handlePnfFilterChange = (value: string) => {
    setPnfFilter(value)
    setPage(1)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { role: 'DOCENTE', page, limit: 20 }
      if (debouncedSearch) params.q = debouncedSearch
      if (isUnscoped && sedeFilter) params.sedeId = sedeFilter
      if (pnfFilter) params.sedePnfId = pnfFilter
      const res = await api.get('/users', { params })
      const list: User[] = res.data.data ?? res.data
      const docentes = Array.isArray(list) ? list : []
      const clasesPorDocente = await Promise.all(
        docentes.map((u) => api.get('/clases', { params: { docenteId: u.id } }).catch(() => ({ data: [] }))),
      )
      setUsers(docentes.map((u, i) => {
        const clases = clasesPorDocente[i].data.data ?? clasesPorDocente[i].data
        const subjects = (Array.isArray(clases) ? clases : [])
          .map((c: any) => c.unidadCurricular?.nombre)
          .filter(Boolean)
        return {
          id: u.id,
          name: u.nombreCompleto,
          initials: (u.nombres?.charAt(0) ?? '') + (u.apellidos?.charAt(0) ?? ''),
          idNumber: u.ci,
          email: u.email,
          sedePnfId: u.sedePnfId,
          subjects,
          status: 'Activo',
        }
      }))
      if (res.data.meta) setMeta(res.data.meta)
    } catch { setUsers([]) }
    finally { setLoading(false) }
  }, [isUnscoped, sedeFilter, pnfFilter, page, debouncedSearch])

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
      params: { role: 'DOCENTE' },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    await fetchData()
    return res.data
  }

  return (
    <div className="space-y-6">
      <ProfessorsTable
        data={users}
        loading={loading}
        onImport={handleImport}
        onCreate={() => { setEditingUser(null); setModalOpen(true) }}
        onEdit={(item) => { setEditingUser(item); setModalOpen(true) }}
        onDelete={(item) => setDeletingUser(item)}
        onResetDevice={(item) => setResettingDeviceUser(item)}
        canEdit={canEdit}
        canResetDevice={canResetDevice}
        canDelete={canDelete}
        sedeOptions={sedeOptions}
        sedeFilter={sedeFilter}
        onSedeFilterChange={isUnscoped ? handleSedeFilterChange : undefined}
        pnfOptions={pnfOptions}
        pnfFilter={pnfFilter}
        onPnfFilterChange={handlePnfFilterChange}
        searchQuery={search}
        onSearchQueryChange={setSearch}
        currentPage={page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        onPageChange={setPage}
      />

      <UserFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={editingUser ? handleEdit : handleCreate}
        defaultRole={Role.DOCENTE}
        initialData={editingUser ? { nombres: editingUser.name?.split(' ')[0], apellidos: editingUser.name?.split(' ').slice(1).join(' '), ci: editingUser.idNumber, email: editingUser.email, sedePnfId: editingUser.sedePnfId } : undefined}
        isEditing={!!editingUser}
      />

      <ConfirmDeleteModal
        open={!!deletingUser}
        onOpenChange={(v) => { if (!v) setDeletingUser(null) }}
        onConfirm={handleDelete}
        title="Eliminar Docente"
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
