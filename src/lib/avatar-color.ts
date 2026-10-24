// Un solo tono para todos los avatares (bg-primary/10 en todas las tablas)
// hacía que una lista de personas se escaneara solo por texto, nunca por
// color — el mismo problema que Slack/Linear/GitHub resuelven asignando el
// tono por hash del identificador. Los 5 tonos son pares sólidos propios
// (--avatar-N-bg/fg en index.css, con su equivalente en modo oscuro) en vez
// de reusar bg-primary/N% con opacidad: un primer intento con opacidad medía
// bien en claro pero caía hasta ~2.1:1 en oscuro una vez compuesto de
// verdad, porque un tono pensado para "botón sólido" no garantiza nada al
// diluirlo — los pares de acá se verificaron sólidos, no diluidos.
const AVATAR_PALETTE = [
  { bg: 'bg-avatar-1-bg', text: 'text-avatar-1-fg' },
  { bg: 'bg-avatar-2-bg', text: 'text-avatar-2-fg' },
  { bg: 'bg-avatar-3-bg', text: 'text-avatar-3-fg' },
  { bg: 'bg-avatar-4-bg', text: 'text-avatar-4-fg' },
  { bg: 'bg-avatar-5-bg', text: 'text-avatar-5-fg' },
] as const

export function avatarColorFor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const { bg, text } = AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
  return `${bg} ${text}`
}
