import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      // `bg-accent`: el token "accent" de este proyecto es el ámbar
      // institucional (#FFC107, index.css) — un skeleton con ese fondo se ve
      // amarillo, no gris. `bg-muted` es el neutro real, ya adaptado a ambos
      // temas.
      className={cn('bg-muted animate-pulse rounded-md', className)}
      {...props}
    />
  )
}

export { Skeleton }
