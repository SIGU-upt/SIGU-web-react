import { Check, X } from "lucide-react"
import { PASSWORD_RULES } from "@/lib/password"

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
