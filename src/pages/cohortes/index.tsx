import { Fragment, useState, useCallback, useEffect } from "react"
import { GraduationCap, ChevronDown, ChevronRight, UserMinus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/ui/page-header"
import { CohorteGrupoFormModal } from "@/components/forms/cohorte-grupo-form-modal"
import { RetirarCohorteModal } from "@/components/forms/retirar-cohorte-modal"
import { useAuth } from "@/contexts/AuthContext"
import { Role, type Cohorte, type AlumnoCohorte } from "@/types"
import api from "@/config/api"
import { toast } from "sonner"

export function CohortesPage() {
  const { user } = useAuth()
  const [data, setData] = useState<Cohorte[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Cohorte | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [miembros, setMiembros] = useState<AlumnoCohorte[]>([])
  const [loadingMiembros, setLoadingMiembros] = useState(false)
  const [retirando, setRetirando] = useState<AlumnoCohorte | null>(null)

  const canGestionar = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/cohortes-grupos')
      const list = res.data.data ?? res.data
      setData(Array.isArray(list) ? list : [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleExpand = async (cohorte: Cohorte) => {
    if (expandedId === cohorte.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(cohorte.id)
    setLoadingMiembros(true)
    try {
      const res = await api.get(`/cohortes-grupos/${cohorte.id}`)
      setMiembros(res.data.miembros ?? [])
    } catch {
      setMiembros([])
    } finally {
      setLoadingMiembros(false)
    }
  }

  const handleCreate = async (formData: any) => {
    await api.post('/cohortes-grupos', formData)
    await fetchData()
  }

  const handleUpdate = async (formData: any) => {
    if (!editing) return
    await api.patch(`/cohortes-grupos/${editing.id}`, { nombre: formData.nombre, cupo: formData.cupo })
    await fetchData()
  }

  const handleRetirar = async (retiroData: { motivo: string; fecha?: string }) => {
    if (!retirando) return
    await api.patch(`/cohortes/${retirando.id}/retirar`, retiroData)
    toast.success('Alumno retirado de la cohorte')
    if (expandedId) {
      const res = await api.get(`/cohortes-grupos/${expandedId}`)
      setMiembros(res.data.miembros ?? [])
    }
    await fetchData()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohortes"
        subtitle="Grupos de ingreso — nombre, cupo y miembros"
        icon={<GraduationCap className="h-5 w-5" />}
        actions={canGestionar ? <Button onClick={() => setCreating(true)}>Nueva Cohorte</Button> : undefined}
      />
      <Card className="shadow-md">
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Cargando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-8" />
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Sede / PNF</TableHead>
                  <TableHead className="font-semibold">Trayecto de ingreso</TableHead>
                  <TableHead className="font-semibold">Período de ingreso</TableHead>
                  <TableHead className="font-semibold">Miembros</TableHead>
                  {canGestionar && <TableHead className="font-semibold text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canGestionar ? 7 : 6} className="text-center py-8 text-muted-foreground">
                      No hay cohortes registradas todavía.
                    </TableCell>
                  </TableRow>
                )}
                {data.map((c) => (
                  <Fragment key={c.id}>
                    <TableRow className="cursor-pointer" onClick={() => toggleExpand(c)}>
                      <TableCell>
                        {expandedId === c.id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="font-medium">{c.nombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.sedePnf?.sede?.nombre ?? '—'} · {c.sedePnf?.pnf?.nombre ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.trayecto?.nombre ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.periodoIngreso?.nombre ?? '—'}</TableCell>
                      <TableCell className="text-sm">
                        {c.miembrosActivos ?? 0}{c.cupo != null ? ` / ${c.cupo}` : ''}
                        {c.cupo != null && (c.miembrosActivos ?? 0) >= c.cupo && (
                          <Badge variant="destructive" className="ml-2">Cupo lleno</Badge>
                        )}
                      </TableCell>
                      {canGestionar && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditing(c) }}>Editar</Button>
                        </TableCell>
                      )}
                    </TableRow>
                    {expandedId === c.id && (
                      <TableRow key={`${c.id}-detalle`}>
                        <TableCell colSpan={canGestionar ? 7 : 6} className="bg-muted/20 p-0">
                          <div className="p-4">
                            {loadingMiembros ? (
                              <div className="text-sm text-muted-foreground py-2">Cargando miembros...</div>
                            ) : miembros.length === 0 ? (
                              <div className="text-sm text-muted-foreground py-2">Esta cohorte todavía no tiene miembros.</div>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Alumno</TableHead>
                                    <TableHead>Cédula</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Trayecto actual</TableHead>
                                    {canGestionar && <TableHead className="text-right">Acciones</TableHead>}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {miembros.map((m) => (
                                    <TableRow key={m.id}>
                                      <TableCell className="text-sm">{m.alumno?.nombreCompleto ?? m.alumnoId}</TableCell>
                                      <TableCell className="text-sm text-muted-foreground">{m.alumno?.ci ?? '—'}</TableCell>
                                      <TableCell className="text-sm">
                                        {m.activa ? (
                                          <Badge variant="secondary">Activa</Badge>
                                        ) : m.motivoRetiro ? (
                                          <Badge variant="outline">Retirada{m.fechaRetiro ? ` (${m.fechaRetiro})` : ''}</Badge>
                                        ) : (
                                          <Badge variant="outline">Inactiva (promovida)</Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">{m.trayecto?.nombre ?? '—'}</TableCell>
                                      {canGestionar && (
                                        <TableCell className="text-right">
                                          {m.activa && (
                                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setRetirando(m)}>
                                              <UserMinus className="mr-1 h-3.5 w-3.5" /> Retirar
                                            </Button>
                                          )}
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CohorteGrupoFormModal open={creating} onOpenChange={setCreating} onSubmit={handleCreate} />
      <CohorteGrupoFormModal
        open={!!editing}
        onOpenChange={(v) => { if (!v) setEditing(null) }}
        onSubmit={handleUpdate}
        isEditing
        initialData={editing ? {
          nombre: editing.nombre,
          sedePnfId: editing.sedePnfId,
          trayectoId: editing.trayectoId,
          periodoIngresoId: editing.periodoIngresoId,
          cupo: editing.cupo ?? undefined,
        } : undefined}
      />
      <RetirarCohorteModal
        open={!!retirando}
        onOpenChange={(v) => { if (!v) setRetirando(null) }}
        onConfirm={handleRetirar}
        alumnoNombre={retirando?.alumno?.nombreCompleto}
      />
    </div>
  )
}
