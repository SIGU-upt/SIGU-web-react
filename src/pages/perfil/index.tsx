import { useState } from "react"
import { useForm } from "react-hook-form"
import { User as UserIcon, KeyRound } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PasswordFormData>()
  const newPassword = watch("newPassword")
  const [pendingPassword, setPendingPassword] = useState<PasswordFormData | null>(null)

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
      toast.success("Contraseña actualizada")
      reset()
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cambiar la contraseña"))
    } finally {
      setPendingPassword(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" subtitle="Tus datos y tu contraseña" icon={<UserIcon className="h-5 w-5" />} />

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

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Cambiar contraseña
          </CardTitle>
        </CardHeader>
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
    </div>
  )
}
