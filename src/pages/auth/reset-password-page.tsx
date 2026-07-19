import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { GraduationCap, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/config/api"

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)
    try {
      await api.post("/auth/reset-password", { token, password })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
          <GraduationCap className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">SIGU</h1>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Control de Estudios</p>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-foreground">Nueva contraseña</CardTitle>
          <CardDescription>Ingrese y confirme su nueva contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="space-y-4">
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                El enlace de recuperación es inválido. Solicite uno nuevo.
              </div>
              <Link to="/forgot-password" className="block text-center text-sm text-primary hover:underline">
                Solicitar nuevo enlace
              </Link>
            </div>
          ) : success ? (
            <div className="space-y-4">
              <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                Contraseña restablecida exitosamente.
              </div>
              <Link to="/login">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-base font-semibold">
                  Ir a iniciar sesión
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-secondary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 bg-secondary"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-base font-semibold transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? "Restableciendo..." : "Restablecer contraseña"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="mt-8 text-sm text-muted-foreground">
        © 2026 Universidad • Sistema de Gestión Universitaria
      </p>
    </div>
  )
}
