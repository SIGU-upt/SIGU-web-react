import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusType = 
  | "active" | "inactive" 
  | "regular" | "irregular" 
  | "present" | "absent" | "justified"
  | "compulsory" | "elective"

interface StatusBadgeProps {
  status: StatusType | string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status.toLowerCase()
  
  const getStatusStyles = () => {
    switch (s) {
      case "active":
      case "activo":
      case "activa":
      case "presente":
      case "present":
      case "regular":
        return "bg-success hover:bg-success/90 text-white"
      case "inactive":
      case "inactivo":
      case "inactiva":
      case "ausente":
      case "absent":
      case "irregular":
        return "bg-destructive hover:bg-destructive/90 text-white"
      case "justificado":
      case "justified":
        return "bg-accent text-accent-foreground hover:bg-accent/90"
      case "obligatoria":
      case "compulsory":
        return "border-primary/30 text-primary"
      case "electiva":
      case "elective":
        return "border-amber-500/30 text-amber-600"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const isOutline = s === "obligatoria" || s === "electiva" || s === "compulsory" || s === "elective"

  return (
    <Badge 
      variant={isOutline ? "outline" : "default"} 
      className={cn("font-medium", getStatusStyles(), className)}
    >
      {status}
    </Badge>
  )
}
