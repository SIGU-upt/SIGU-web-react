import { useState, useEffect } from "react"
import { Users, LayoutDashboard, GraduationCap, Building2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/config/api"
import { crearEstudiante } from "@/lib/estudiantes"
import { AttendanceTable } from "@/components/dashboard/attendance-table"
import { UserFormModal, type UserFormData } from "@/components/forms/user-form-modal"
import { Role } from "@/types"

interface DashboardData {
  totalUsuarios: number
  totalDocentes: number
  totalAlumnos: number
  totalClases: number
  totalInscripciones: number
  sedeNombre: string
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

  const handleCreateUser = async (data: UserFormData) => {
    // El estudiante se crea igual que en Estudiantes (trayecto y matrícula incluidos).
    // El docente no tiene campo de trayecto en el formulario.
    if (newUserRole === Role.ALUMNO) await crearEstudiante(data, user?.sedePnfId)
    else await api.post('/users', { ...data, role: newUserRole })
  }

  const roleLabels: Record<string, string> = {
    SUPERADMIN: 'Super Administrador',
    RECTOR: 'Rector',
    AUDITOR: 'Auditor',
    COORDINADOR: 'Coordinador',
    DOCENTE: 'Docente',
    ALUMNO: 'Alumno',
    VIGILANTE: 'Vigilante',
  }
  const roleName = user ? (roleLabels[user.role] || user.role) : ''

  const totalPersonas = (stats?.totalDocentes ?? 0) + (stats?.totalAlumnos ?? 0)
  const docentesPct = totalPersonas ? ((stats?.totalDocentes ?? 0) / totalPersonas) * 100 : 0
  const alumnosPct = totalPersonas ? ((stats?.totalAlumnos ?? 0) / totalPersonas) * 100 : 0

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

      {stats && (
        // Los números de abajo ya vienen acotados a la jurisdicción del rol
        // (sede para RECTOR, sede-PNF para COORDINADOR) — sin esto no había
        // ninguna forma de saber, mirando la pantalla, si eran del sistema
        // completo o de un subconjunto.
        <Badge variant="outline" className="gap-1.5 py-1.5">
          <Building2 className="h-3.5 w-3.5" />
          Ámbito: {stats.sedeNombre}
        </Badge>
      )}

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Cargando estadísticas...</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="lg:col-span-2">
            <CardContent className="flex h-full flex-col p-6">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>

              <div className="mt-6 flex-1">
                <p className="text-5xl font-bold">{stats?.totalUsuarios ?? '—'}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Incluye personal académico y administrativo
                </p>
              </div>

              <div>
                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="bg-primary" style={{ width: `${docentesPct}%` }} />
                  <div className="bg-accent" style={{ width: `${alumnosPct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Docentes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Alumnos
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* En lg, este wrapper pasa de `contents` (aplana sus hijos en el
              grid exterior, igual que antes) a columna flex que estira su
              altura a la de la tarjeta grande de la izquierda; el espacio
              sobrante se reparte como separación entre bloques (justify-between)
              en vez de inflar el padding interno de cada tarjeta chica. */}
          <div className="contents lg:flex lg:flex-col lg:col-span-2 lg:justify-between lg:gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="mb-3 text-sm font-medium text-muted-foreground">Docentes y Alumnos</p>
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-2xl font-bold">{stats?.totalDocentes ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">Docentes</p>
                  </div>
                  <div className="mx-4 h-10 w-px bg-border" />
                  <div className="flex-1">
                    <p className="text-2xl font-bold">{stats?.totalAlumnos ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">Alumnos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="contents lg:grid lg:grid-cols-2 lg:gap-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">Total Clases</p>
                  <p className="mt-2 text-3xl font-bold">{stats?.totalClases ?? '—'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">Inscripciones</p>
                  <p className="mt-2 text-3xl font-bold">{stats?.totalInscripciones ?? '—'}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      <AttendanceTable />

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
