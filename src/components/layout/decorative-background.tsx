// Fondo decorativo muy sutil: un degradado casi imperceptible más 3 formas
// geométricas grandes a baja opacidad, solo para darle algo de personalidad
// al fondo plano sin perder el tono formal/académico. Usa los tokens de color
// ya definidos (primary/accent) para que respete el tema claro/oscuro sin
// colores nuevos hardcodeados. Puramente decorativo: pointer-events-none y
// aria-hidden para que no interfiera con el contenido ni con lectores de
// pantalla.
export function DecorativeBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 15% 0%, color-mix(in srgb, var(--color-primary) 5%, transparent), transparent), " +
          "radial-gradient(ellipse 60% 40% at 100% 100%, color-mix(in srgb, var(--color-accent) 5%, transparent), transparent)",
      }}
    >
      <svg
        className="absolute -right-24 -top-24 h-[28rem] w-[28rem] text-primary opacity-[0.04]"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="95" stroke="currentColor" strokeWidth="2" />
        <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg
        className="absolute -bottom-32 -left-20 h-[24rem] w-[24rem] text-accent opacity-[0.045] rotate-12"
        viewBox="0 0 200 200"
        fill="none"
      >
        <polygon points="100,10 190,170 10,170" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg
        className="absolute left-1/2 top-1/3 h-72 w-72 text-primary opacity-[0.03] -translate-x-1/2"
        viewBox="0 0 200 200"
        fill="none"
      >
        <rect x="10" y="10" width="180" height="180" rx="24" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  )
}
