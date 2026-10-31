import { useEffect } from "react"
import { Fingerprint } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

interface CedulaInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

// Mismo patrón que login-page.tsx: el prefijo (V/E) vive en un selector aparte,
// el campo de texto solo guarda dígitos. Se combinan en "V-12345678" al notificar
// el cambio, que es el formato que ya valida ciRule (lib/validators.ts).
export function CedulaInput({ id, value, onChange, disabled }: CedulaInputProps) {
  const match = value.toUpperCase().match(/^([VE])-?(\d*)/)
  const prefix = match?.[1] ?? "V"
  const digits = match?.[2] ?? value.replace(/\D/g, "")

  // Un valor guardado sin prefijo (bug de import ya corregido, pero puede
  // haber quedado alguno viejo en la base) se mostraba "ya corregido" — V-
  // por defecto en el selector, los dígitos en la caja — sin que el
  // formulario recibiera nunca ese valor corregido: si el admin no tocaba
  // el campo, "editar" no cambiaba nada en el envío. Se emite la
  // normalización apenas se detecta, para que el formulario quede con el
  // valor correcto aunque nadie lo haya retecleado.
  useEffect(() => {
    if (value && !/^[VE]-\d+$/.test(value.toUpperCase())) {
      onChange(`${prefix}-${digits}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handlePrefixChange = (newPrefix: string) => {
    onChange(`${newPrefix}-${digits}`)
  }

  const handleDigitsChange = (raw: string) => {
    const upper = raw.toUpperCase()
    const pastedMatch = upper.match(/^([VE])/)
    const effectivePrefix = pastedMatch ? pastedMatch[1] : prefix
    onChange(`${effectivePrefix}-${upper.replace(/\D/g, "").slice(0, 9)}`)
  }

  return (
    <div className="flex gap-2">
      <Select value={prefix} onValueChange={handlePrefixChange} disabled={disabled}>
        <SelectTrigger className="w-[88px] bg-secondary" aria-label="Nacionalidad">
          <span>{prefix}-</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="V">V- Venezolano</SelectItem>
          <SelectItem value="E">E- Extranjero</SelectItem>
        </SelectContent>
      </Select>
      <div className="relative flex-1">
        <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder="12345678"
          className="pl-10 bg-secondary"
          value={digits}
          onChange={(e) => handleDigitsChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
