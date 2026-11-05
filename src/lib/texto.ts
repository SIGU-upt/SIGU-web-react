export function normalizarParaBuscar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Para filtros client-side (ya no hay petición al servidor que normalice) —
// mismo criterio accent-insensitive que ya usa el buscador global y los
// endpoints con `unaccent()`.
export function coincideSinAcentos(texto: string | undefined | null, busqueda: string): boolean {
  if (!busqueda) return true
  if (!texto) return false
  return normalizarParaBuscar(texto).includes(normalizarParaBuscar(busqueda))
}
