import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Layers, Search, Plus, MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { PageHeader } from "@/components/ui/page-header"
import { SeccionFormModal } from "@/components/forms/seccion-form-modal"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type Seccion } from "@/types"
import api from "@/config/api"

export function SeccionesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<Seccion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Seccion | null>(null)
  const [deleting, setDeleting] = useState<Seccion | null>(null)

  const canEdit = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false
  const canDelete = user?.role === Role.SUPERADMIN

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (debouncedSearch) params.q = debouncedSearch
      if (user?.sedePnfId) params.sedePnfId = user.sedePnfId
      const res = await api.get('/secciones', { params })
      setData(res.data.data ?? res.data)
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [debouncedSearch, user?.sedePnfId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async (form: Record<string, any>) => {
    await api.post('/secciones', form)
    await fetchData()
  }

  const handleEdit = async (form: Record<string, any>) => {
    if (!editing) return
    await api.patch(`/secciones/${editing.id}`, form)
    await fetchData()
  }

  const handleDelete = async () => {
    if (!deleting) return
    await api.delete(`/secciones/${deleting.id}`)
    await fetchData()
  }

  const filtered = Array.isArray(data) ? data.filter((s) =>
    !search || s.codigo.toLowerCase().includes(search.toLowerCase())
  ) : []

  const perPage = 10
  const totalPages = Math.ceil(filtered.length / perPage)
  const start = (page - 1) * perPage
  const paginated = filtered.slice(start, start + perPage)

  return (
    <div className="space-y-6">
      <PageHeader title="Secciones" subtitle="Gestión de secciones administrativas" icon={<Layers className="h-5 w-5" />} />
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por código..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10" />
            </div>
            {canEdit && (
              <Button className="bg-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
                <Plus className="mr-2 h-4 w-4" /> Nueva Sección
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Cargando...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Código</TableHead>
                    <TableHead className="font-semibold">Trayecto</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/secciones/${s.id}`)}>
                      <TableCell><Badge variant="secondary" className="font-mono">{s.codigo}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.trayecto?.nombre ?? s.trayectoId}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {canEdit ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/secciones/${s.id}`)}>Ver Clases</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setEditing(s); setModalOpen(true) }}>Editar</DropdownMenuItem>
                              {canDelete && (
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(s)}>Eliminar</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-xs text-muted-foreground">Solo lectura</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls currentPage={page} totalPages={totalPages} totalItems={filtered.length} startIndex={start} endIndex={start + perPage} onPageChange={setPage} label="secciones" />
            </>
          )}
        </CardContent>
      </Card>

      <SeccionFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={editing ? handleEdit : handleCreate}
        initialData={editing ? { codigo: editing.codigo, sedePnfId: editing.sedePnfId, trayectoId: editing.trayectoId } : undefined}
        isEditing={!!editing}
      />

      <ConfirmDeleteModal
        open={!!deleting}
        onOpenChange={(v) => { if (!v) setDeleting(null) }}
        onConfirm={handleDelete}
        title="Eliminar Sección"
        description={`¿Eliminar la sección "${deleting?.codigo}"?`}
      />
    </div>
  )
}
