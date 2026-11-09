import * as XLSX from "xlsx"

/** Mismo formato (.xlsx) que el resto del sistema genera en el servidor, para listas que ya están cargadas en el cliente. */
export function downloadXlsx(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return

  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, "Hoja1")
  XLSX.writeFile(workbook, filename)
}
