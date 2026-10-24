import * as React from 'react'

// 1024px (Tailwind `lg`) — no 768px del componente shadcn de origen. El resto
// de la app ya usa `lg:` como el corte móvil/escritorio (ver dashboard-layout,
// top-bar); este hook solo lo consume el sidebar, así que se alinea a esa
// convención en vez de introducir un segundo corte distinto.
const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
