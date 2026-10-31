import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { User as UserIcon, KeyRound, Building2, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/form-error"
import { PageHeader } from "@/components/ui/page-header"
import { ConfirmDeleteModal } from "@/components/forms/confirm-delete-modal"
import { useAuth } from "@/contexts/AuthContext"
import { getErrorMessage } from "@/lib/errors"
import api from "@/config/api"
import { Role } from "@/types"
import { toast } from "sonner"

const roleLabels: Record<Role, string> = {
  [Role.SUPERADMIN]: "Super Administrador",
  [Role.RECTOR]: "Rector",
  [Role.AUDITOR]: "Auditor",
  [Role.COORDINADOR]: "Coordinador",
  [Role.DOCENTE]: "Docente",
  [Role.ALUMNO]: "Alumno",
  [Role.VIGILANTE]: "Vigilante",
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

export function PerfilPage() {
  const { user, mustChangePassword, logout } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PasswordFormData>()
  const newPassword = watch("newPassword")
  const [pendingPassword, setPendingPassword] = useState<PasswordFormData | null>(null)
  // Con una clave temporal el formulario se muestra abierto: es lo único que se puede hacer.
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(mustChangePassword)
  type PersonaInstitucion = { id: string; nombreCompleto: string; ci: string }
  const [rectoresDeMiSede, setRectoresDeMiSede] = useState<PersonaInstitucion[]>([])
  const [auditoresDeMiSede, setAuditoresDeMiSede] = useState<PersonaInstitucion[]>([])

  useEffect(() => {
    // Con una clave temporal el API responde 403 a todo salvo cambiar la contraseña.
    if (mustChangePassword) return
    api.get('/users/mi-institucion').then((res) => {
      setRectoresDeMiSede(Array.isArray(res.data?.rectores) ? res.data.rectores : [])
      setAuditoresDeMiSede(Array.isArray(res.data?.auditores) ? res.data.auditores : [])
    }).catch(() => { setRectoresDeMiSede([]); setAuditoresDeMiSede([]) })
  }, [mustChangePassword])

  if (!user) return null

  const onSubmit = (data: PasswordFormData) => {
    // Comentario de Vercel en /perfil: pedir confirmación antes de ejecutar el
    // cambio, en vez de que el formulario lo dispare directo al enviar.
    setPendingPassword(data)
  }

  const confirmChangePassword = async () => {
    if (!pendingPassword) return
    setError(null)
    try {
      await api.post("/auth/change-password", {
        currentPassword: pendingPassword.currentPassword,
        newPassword: pendingPassword.newPassword,
      })
      reset()
      if (mustChangePassword) {
        // El token de la clave temporal sigue marcado como «debe cambiarla»: hay que entrar de nuevo.
        toast.success("Contraseña actualizada. Inicie sesión con la nueva.")
        logout()
        return
      }
      toast.success("Contraseña actualizada")
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cambiar la contraseña"))
    } finally {
      setPendingPassword(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" subtitle="Tus datos y tu contraseña" icon={<UserIcon className="h-5 w-5" />} />

      {mustChangePassword && (
        <Alert variant="destructive">
          <KeyRound className="h-4 w-4" />
          <AlertTitle>Debe cambiar su contraseña temporal</AlertTitle>
          <AlertDescription>
            Está usando una contraseña temporal. Cámbiela abajo para poder usar el resto del sistema.
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Mis datos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Dato label="Nombre completo" value={user.nombreCompleto} />
          <Dato label="Cédula" value={user.ci} />
          <Dato label="Correo" value={user.email} />
          <Dato label="Rol" value={roleLabels[user.role] ?? user.role} />
          {user.sedePnf && (
            <>
              <Dato label="Sede" value={user.sedePnf.sede?.nombre ?? "—"} />
              <Dato label="PNF" value={user.sedePnf.pnf?.nombre ?? "—"} />
            </>
          )}
          {!user.sedePnf && user.sedeActual && (
            <Dato label="Sede" value={user.sedeActual.nombre} />
          )}
        </CardContent>
      </Card>

      {(rectoresDeMiSede.length > 0 || auditoresDeMiSede.length > 0) && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Mi institución
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rectoresDeMiSede.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {user.role === Role.RECTOR ? 'Otros rectores de su misma sede:' : 'Rector(es) de su sede:'}
                </p>
                {rectoresDeMiSede.map((r) => (
                  <p key={r.id} className="text-sm">{r.nombreCompleto} — {r.ci}</p>
                ))}
              </div>
            )}
            {auditoresDeMiSede.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Auditor(es) de su sede:</p>
                {auditoresDeMiSede.map((a) => (
                  <p key={a.id} className="text-sm">{a.nombreCompleto} — {a.ci}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md">
        <Collapsible open={mostrarCambioPassword} onOpenChange={setMostrarCambioPassword}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer select-none">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" /> Cambiar contraseña
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${mostrarCambioPassword ? "rotate-180" : ""}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <Input
                id="currentPassword"
                type="password"
                {...register("currentPassword", { required: "Requerido" })}
              />
              {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                {...register("newPassword", {
                  required: "Requerido",
                  minLength: { value: 8, message: "Mínimo 8 caracteres" },
                  pattern: {
                    value: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
                    message: "Debe incluir mayúscula, minúscula, número y símbolo",
                  },
                })}
              />
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword", {
                  required: "Requerido",
                  validate: (v) => v === newPassword || "Las contraseñas no coinciden",
                })}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            {error && <FormError>{error}</FormError>}
            <Button type="submit">Cambiar contraseña</Button>
          </form>
        </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <ConfirmDeleteModal
        open={pendingPassword !== null}
        onOpenChange={(open) => { if (!open) setPendingPassword(null) }}
        onConfirm={confirmChangePassword}
        title="Cambiar contraseña"
        description="Va a cambiar su contraseña de acceso. Tendrá que usar la nueva la próxima vez que inicie sesión. ¿Desea continuar?"
        confirmLabel="Sí, cambiar"
        loadingLabel="Cambiando..."
      />

      <p className="text-center text-xs text-muted-foreground">
        <Link to="/privacidad" className="hover:underline">Política de privacidad</Link>
        {' · '}
        <Link to="/terminos" className="hover:underline">Términos de uso</Link>
      </p>
    </div>
  )
}
