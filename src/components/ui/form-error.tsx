// En modo oscuro, texto color `destructive` (pensado como botón sólido)
// sobre un fondo `bg-destructive/10` medía ~4.3:1 — por debajo de las 4.5:1
// que exige WCAG AA para texto normal, y se leía apagado. `dark:text-` usa
// un tono más claro de la misma familia, verificado en ~6:1.
export function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return (
    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive dark:text-[#F3A08A]">
      {children}
    </div>
  )
}
