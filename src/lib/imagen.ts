const LADO_MAXIMO = 1600
const CALIDAD_JPG = 0.75

function cargarImagen(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") return createImageBitmap(file)
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la imagen")) }
    img.src = url
  })
}

/**
 * Reduce una imagen antes de subirla: la pasa a JPG y limita su lado mayor a
 * 1600 px (suficiente para leer un justificante). Un PDF se devuelve igual.
 * Si algo falla, o el resultado no pesa menos, se devuelve el archivo original.
 * El fondo transparente de un PNG se rellena de blanco, porque JPG no lo admite.
 */
export async function comprimirImagenAJpeg(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file
  try {
    const origen = await cargarImagen(file)
    const escala = Math.min(1, LADO_MAXIMO / Math.max(origen.width, origen.height))
    const ancho = Math.round(origen.width * escala)
    const alto = Math.round(origen.height * escala)

    const canvas = document.createElement("canvas")
    canvas.width = ancho
    canvas.height = alto
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, ancho, alto)
    ctx.drawImage(origen, 0, 0, ancho, alto)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", CALIDAD_JPG))
    if (!blob || blob.size >= file.size) return file
    const nombre = file.name.replace(/\.[^.]+$/, "") || "evidencia"
    return new File([blob], `${nombre}.jpg`, { type: "image/jpeg" })
  } catch {
    return file
  }
}
