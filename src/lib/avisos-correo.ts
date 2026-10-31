import { toast } from "sonner"
import type { User } from "@/types"

/**
 * POST /users intenta confirmar el envío del correo de bienvenida antes de
 * responder (con un límite corto, ver UsersService.create). Si no se pudo
 * confirmar, el admin que creó la cuenta debe saberlo para generar una
 * contraseña temporal a mano en vez de asumir que la persona ya la recibió.
 */
export function avisarSiCorreoBienvenidaFallo(usuario: Pick<User, "emailBienvenidaEnviado" | "email">) {
  if (usuario.emailBienvenidaEnviado === false) {
    toast.warning(
      `El usuario se creó, pero no se pudo confirmar el envío del correo de bienvenida a ${usuario.email}. Puede que llegue más tarde o haya caído en Spam; si no, genere una contraseña temporal desde el listado.`,
    )
  }
}
