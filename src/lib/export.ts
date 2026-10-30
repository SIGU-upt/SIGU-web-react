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
