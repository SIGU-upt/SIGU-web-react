import { useState } from "react"
import { Link } from "react-router-dom"
import { GraduationCap, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/config/api"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setIsLoading(true)

    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() })
      setMessage(res.data?.message ?? "Si el email está registrado, recibirá instrucciones para restablecer su contraseña")
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
          <CardTitle className="text-2xl font-bold text-foreground">Restablecer contraseña</CardTitle>
          <CardDescription>
            Ingrese su correo electrónico y le enviaremos instrucciones para restablecer su contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="space-y-4">
              <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">{message}</div>
              <Link to="/login" className="block text-center text-sm text-primary hover:underline">
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usted@uptjfr.edu.ve"
                    className="pl-10 bg-secondary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                {isLoading ? "Enviando..." : "Enviar instrucciones"}
              </Button>

              <Link to="/login" className="block text-center text-sm text-muted-foreground hover:underline">
                Volver a iniciar sesión
              </Link>
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
