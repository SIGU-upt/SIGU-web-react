import { useState, useEffect } from "react"
import { Users, BookOpen, LayoutDashboard, GraduationCap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/config/api"
import { AttendanceTable } from "@/components/dashboard/attendance-table"
import { UserFormModal } from "@/components/forms/user-form-modal"
import { Role } from "@/types"

interface DashboardData {
  totalUsuarios: number
  totalDocentes: number
  totalAlumnos: number
  totalClases: number
  totalInscripciones: number
}

export function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [newUserRole, setNewUserRole] = useState<Role.ALUMNO | Role.DOCENTE | null>(null)

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const canCreateUsers = user ? [Role.SUPERADMIN, Role.RECTOR, Role.COORDINADOR].includes(user.role) : false

  const handleCreateUser = async (data: any) => {
    await api.post('/users', { ...data, role: newUserRole })
  }

  const roleLabels: Record<string, string> = {
    SUPERADMIN: 'Super Administrador',
    RECTOR: 'Rector',
    ANALISTA: 'Analista',
    COORDINADOR: 'Coordinador',
    DOCENTE: 'Docente',
    ALUMNO: 'Alumno',
    VIGILANTE: 'Vigilante',
  }
  const roleName = user ? (roleLabels[user.role] || user.role) : ''

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de Control"
        subtitle={user ? `Bienvenido, ${user.nombres} ${user.apellidos} (${roleName})` : 'Cargando...'}
        icon={<LayoutDashboard className="h-6 w-6" />}
        actions={canCreateUsers && (
          <>
            <Button variant="outline" onClick={() => setNewUserRole(Role.ALUMNO)}>
              <Users className="mr-2 h-4 w-4" />
              Nuevo Estudiante
            </Button>
            <Button variant="outline" onClick={() => setNewUserRole(Role.DOCENTE)}>
              <GraduationCap className="mr-2 h-4 w-4" />
              Nuevo Docente
            </Button>
          </>
        )}
      />

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Cargando estadísticas...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Docentes</p>
                  <p className="text-3xl font-bold">{stats?.totalDocentes ?? '—'}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <GraduationCap className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Alumnos</p>
                  <p className="text-3xl font-bold">{stats?.totalAlumnos ?? '—'}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Clases</p>
                  <p className="text-3xl font-bold">{stats?.totalClases ?? '—'}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                  <BookOpen className="h-6 w-6 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {stats && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-md">
            <CardContent className="p-6 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
              <p className="text-3xl font-bold">{stats.totalUsuarios}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="p-6 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Inscripciones Totales</p>
              <p className="text-3xl font-bold">{stats.totalInscripciones}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <AttendanceTable />

      <Card className="shadow-md">
        <CardContent className="p-8 text-center">
          <GraduationCap className="h-12 w-12 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">SIGU — Sistema de Gestión Universitaria</h3>
          <p className="text-sm text-muted-foreground mt-1">
            UPT José Félix Ribas — Núcleo Socopó
          </p>
        </CardContent>
      </Card>

      {newUserRole && (
        <UserFormModal
          open={!!newUserRole}
          onOpenChange={(open) => { if (!open) setNewUserRole(null) }}
          onSubmit={handleCreateUser}
          defaultRole={newUserRole}
        />
      )}
    </div>
  )
}
