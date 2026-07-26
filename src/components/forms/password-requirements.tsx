import { Check, X } from "lucide-react"

interface PasswordRule {
  label: string
  test: (password: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "Mínimo 8 caracteres", test: (p) => p.length >= 8 },
  { label: "Al menos una minúscula", test: (p) => /[a-z]/.test(p) },
  { label: "Al menos una mayúscula", test: (p) => /[A-Z]/.test(p) },
  { label: "Al menos un número", test: (p) => /[0-9]/.test(p) },
  { label: "Al menos un carácter especial", test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export function passwordMeetsRequirements(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password))
}

// Genera una contraseña fuerte que cumple todas las reglas de arriba, sin
// caracteres ambiguos (0/O, 1/l/I). Usa crypto para la aleatoriedad.
export function generateStrongPassword(length = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  const lower = "abcdefghijkmnpqrstuvwxyz"
  const digits = "23456789"
  const symbols = "!@#$%&*"
  const all = upper + lower + digits + symbols
  const rand = (max: number) => crypto.getRandomValues(new Uint32Array(1))[0] % max
  const pick = (set: string) => set[rand(set.length)]
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)]
  for (let i = chars.length; i < length; i++) chars.push(pick(all))
  // Mezcla para no dejar el patrón fijo al inicio.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join("")
}

interface PasswordRequirementsProps {
  password: string
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  return (
    <ul className="space-y-1 text-xs">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password)
        return (
          <li key={rule.label} className={`flex items-center gap-1.5 ${met ? "text-success" : "text-muted-foreground"}`}>
            {met ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}
