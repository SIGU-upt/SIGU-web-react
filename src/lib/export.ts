import api from "@/config/api"

export async function downloadExportedFile(url: string, params: Record<string, string> | undefined, filename: string) {
  const res = await api.get(url, { params, responseType: 'blob' })
  const blobUrl = URL.createObjectURL(res.data)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  link.click()
  URL.revokeObjectURL(blobUrl)
}

/**
 * Igual que `downloadExportedFile`, pero para archivos pensados para verse
 * (foto/PDF de evidencia), no para guardarse — un `<a href>` directo no sirve
 * porque la API exige el header Authorization, que la navegación de un link
 * normal no manda. Se abre en una pestaña nueva en vez de forzar la descarga.
 */
export async function openFileInNewTab(url: string) {
  const res = await api.get(url, { responseType: 'blob' })
  const blobUrl = URL.createObjectURL(res.data)
  window.open(blobUrl, '_blank')
  // No se revoca de inmediato: la pestaña nueva sigue necesitando el blob
  // mientras esté abierta. El navegador libera la memoria al cerrarla.
}
