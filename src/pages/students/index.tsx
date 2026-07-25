import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { StudentsTable } from "@/components/tables/students-table"
import { UserFormModal } from "@/components/forms/user-form-modal"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import api from "@/config/api"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type User, type Trayecto, type SedePnf } from "@/types"

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
  const [sedePnfOptions, setSedePnfOptions] = useState<SedePnf[]>([])
  const [sedeFilter, setSedeFilter] = useState("")
  const [pnfFilter, setPnfFilter] = useState("") // guarda un sedePnfId
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  const isSuperadmin = user?.role === Role.SUPERADMIN
  const isRector = user?.role === Role.RECTOR
  const canEdit = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false
  const canResetDevice = canEdit
  const canDelete = user?.role === Role.SUPERADMIN

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    api.get('/trayectos').then((res) => {
      const list = res.data.data ?? res.data
      setTrayectoOptions(Array.isArray(list) ? list : [])
    }).catch(() => setTrayectoOptions([]))
    api.get('/sede-pnf').then((res) => {
      const list = res.data.data ?? res.data
      setSedePnfOptions(Array.isArray(list) ? list : [])
    }).catch(() => setSedePnfOptions([]))
  }, [])

  // Opciones de sede (solo superadmin): sedes únicas derivadas de las sede-PNF.
  const sedeOptions = isSuperadmin
    ? Array.from(new Map(sedePnfOptions.map((sp) => [sp.sedeId, sp.sede?.nombre ?? sp.sedeId])).entries())
        .map(([id, label]) => ({ id, label }))
    : undefined

  // Opciones de PNF: para superadmin se limitan a la sede elegida; para rector, el
  // servidor ya devuelve solo las sede-PNF de su propia sede (R-3). El valor de
  // cada opción es el sedePnfId (lo que consume el backend).
  const pnfOptions =
    isSuperadmin || isRector
      ? sedePnfOptions
          .filter((sp) => !isSuperadmin || !sedeFilter || sp.sedeId === sedeFilter)
          .map((sp) => ({ id: sp.id, label: sp.pnf?.nombre ?? sp.id }))
      : undefined

  // El trayecto se limita al PNF elegido (evita la lista ambigua con trayectos
  // repetidos de todos los PNF). Sin PNF elegido se muestran todos.
  const selectedPnfId = sedePnfOptions.find((sp) => sp.id === pnfFilter)?.pnfId
  const visibleTrayectoOptions = selectedPnfId
    ? trayectoOptions.filter((t) => t.pnfId === selectedPnfId)
    : trayectoOptions

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { role: 'ALUMNO', page, limit: 20 }
      if (debouncedSearch) params.q = debouncedSearch
      if (isSuperadmin && sedeFilter) params.sedeId = sedeFilter
      if (pnfFilter) params.sedePnfId = pnfFilter
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
        trayectoActualId: u.trayectoActualId ?? '',
        career: u.sedePnf?.pnf?.nombre ?? '—',
        // ADR-022: el trayecto actual es atributo directo del alumno; la cohorte es respaldo.
        semester: u.trayectoActual?.numero ?? u.cohorteActiva?.trayecto?.numero ?? 0,
        status: 'Regular',
      })))
      if (res.data.meta) setMeta(res.data.meta)
    } catch { setUsers([]) }
    finally { setLoading(false) }
  }, [isSuperadmin, sedeFilter, pnfFilter, trayectoFilter, page, debouncedSearch])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Al cambiar un nivel del filtro se limpian los niveles inferiores para no dejar
  // combinaciones inconsistentes (ej. un trayecto de otro PNF).
  const handleSedeFilterChange = (value: string) => {
    setSedeFilter(value)
    setPnfFilter("")
    setTrayectoFilter("")
    setPage(1)
  }
  const handlePnfFilterChange = (value: string) => {
    setPnfFilter(value)
    setTrayectoFilter("")
    setPage(1)
  }
  const handleTrayectoFilterChange = (value: string) => {
    setTrayectoFilter(value)
    setPage(1)
  }

  const handleCreate = async (data: any) => {
    const { trayectoId, ...userData } = data
    // ADR-022: el trayecto actual se guarda como atributo directo del alumno.
    const res = await api.post('/users', { ...userData, role: 'ALUMNO', trayectoActualId: trayectoId || undefined })
    const sedePnfId = data.sedePnfId ?? user?.sedePnfId
    if (trayectoId && sedePnfId) {
      try {
        const periodoRes = await api.get('/periodos/activo', { params: { sedePnfId } })
        const periodo = periodoRes.data
        await api.post('/cohortes', {
          alumnoId: res.data.id,
          sedePnfId,
          trayectoId,
          periodoId: periodo.id,
        })
      } catch (err: any) {
        if (err?.response?.status === 404) {
          // El trayecto ya quedó asignado al alumno (ADR-022); lo que falta es la
          // matrícula en un período (cohorte), que necesita un período activo.
          toast.warning('El estudiante se creó con su trayecto asignado, pero no hay un período académico activo para esa sede-PNF, así que aún no quedó matriculado en un período. Cree un período activo para matricularlo.')
        } else {
          toast.warning('El estudiante se creó con su trayecto asignado, pero no fue posible matricularlo en el período. Puede hacerlo luego.')
        }
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
    // ADR-022: editar el trayecto actual del alumno.
    if (data.trayectoId) payload.trayectoActualId = data.trayectoId
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
      <StudentsTable
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
        trayectoOptions={visibleTrayectoOptions}
        trayectoFilter={trayectoFilter}
        onTrayectoFilterChange={handleTrayectoFilterChange}
        sedeOptions={sedeOptions}
        sedeFilter={sedeFilter}
        onSedeFilterChange={isSuperadmin ? handleSedeFilterChange : undefined}
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
        defaultRole={Role.ALUMNO}
        initialData={editingUser ? { nombres: editingUser.name?.split(' ')[0], apellidos: editingUser.name?.split(' ').slice(1).join(' '), ci: editingUser.idNumber, email: editingUser.email, sedePnfId: editingUser.sedePnfId, trayectoId: editingUser.trayectoActualId } : undefined}
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
