import { useState } from "react"
import { Link } from "react-router-dom"
import { GraduationCap, Lock, Fingerprint, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"

export function LoginPage() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ciPrefix, setCiPrefix] = useState("V")
  const [ci, setCi] = useState("")
  const [password, setPassword] = useState("")

  // El prefijo lo aporta el selector, así que el campo solo guarda dígitos. Si el
  // usuario pega "V-12345678" o teclea "E", el prefijo se traslada al selector en
  // vez de duplicarse. Se corta en 9 dígitos, el máximo que admite ciRule.
  const handleCiChange = (raw: string) => {
    const upper = raw.toUpperCase()
    const match = upper.match(/^([VE])/)
    if (match) setCiPrefix(match[1])
    setCi(upper.replace(/\D/g, '').slice(0, 9))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (ci.length < 6) {
      setError('La cédula debe tener al menos 6 dígitos.')
      return
    }

    setIsLoading(true)

    const errorMsg = await login(`${ciPrefix}-${ci}`, password)
    if (errorMsg) {
      setError(errorMsg)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Link to="/" className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
          <GraduationCap className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">SIGU</h1>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Control de Estudios</p>
        </div>
      </Link>

      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-foreground">Bienvenido</CardTitle>
          <CardDescription>
            Ingrese sus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ci">Cédula de Identidad</Label>
              <div className="flex gap-2">
                <Select value={ciPrefix} onValueChange={setCiPrefix}>
                  <SelectTrigger className="w-[88px] bg-secondary" aria-label="Nacionalidad">
                    <span>{ciPrefix}-</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="V">V- Venezolano</SelectItem>
                    <SelectItem value="E">E- Extranjero</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ci"
                    type="text"
                    inputMode="numeric"
                    placeholder="12345678"
                    className="pl-10 bg-secondary"
                    value={ci}
                    onChange={(e) => handleCiChange(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  ¿Olvidó su contraseña?
                </Link>
              </div>
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
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-8 text-sm text-muted-foreground">
        © 2026 Universidad • Sistema de Gestión Universitaria
      </p>
    </div>
  )
}
