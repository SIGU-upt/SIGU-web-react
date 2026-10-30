import { useState } from "react"
import { AlertTriangle, Database, Download, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import api from "@/config/api"
import { downloadExportedFile } from "@/lib/export"
import { getErrorMessage } from "@/lib/errors"

const FRASE_CONFIRMACION = "RESTAURAR TODO"

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

export function RespaldoTab() {
  const [exportando, setExportando] = useState<"json" | "sql" | null>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [confirmacion, setConfirmacion] = useState("")
  const [restaurando, setRestaurando] = useState(false)

  const handleExportarJson = async () => {
    setExportando("json")
    try {
      await downloadExportedFile("/backup/export", undefined, `backup_sigu_${hoyISO()}.json`)
      toast.success("Respaldo JSON descargado")
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo exportar el respaldo"))
    } finally {
      setExportando(null)
    }
  }

  const handleExportarSql = async () => {
    setExportando("sql")
    try {
      await downloadExportedFile("/backup/export-sql", undefined, `backup_sigu_${hoyISO()}.sql`)
      toast.success("Respaldo SQL descargado")
    } catch (err) {
      toast.error(getErrorMessage(err, "pg_dump no está disponible en este servidor. Use el respaldo JSON."))
    } finally {
      setExportando(null)
    }
  }

  const handleRestaurar = async () => {
    if (!archivo || confirmacion !== FRASE_CONFIRMACION) return
    setRestaurando(true)
    try {
      const formData = new FormData()
      formData.append("file", archivo)
      formData.append("confirmacion", confirmacion)
      const res = await api.post("/backup/restore", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      toast.success(`Base de datos restaurada: ${res.data.filasRestauradas} filas.`)
      setArchivo(null)
      setConfirmacion("")
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo restaurar el respaldo"))
    } finally {
      setRestaurando(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" /> Exportar respaldo
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Descarga una copia completa de las 16 tablas del sistema. El formato JSON siempre funciona; el SQL (pg_dump) es más portable pero depende de que el servidor tenga ese binario instalado.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleExportarJson} disabled={exportando !== null}>
            <Database className="mr-2 h-4 w-4" />
            {exportando === "json" ? "Exportando..." : "Exportar JSON"}
          </Button>
          <Button variant="outline" onClick={handleExportarSql} disabled={exportando !== null}>
            <Database className="mr-2 h-4 w-4" />
            {exportando === "sql" ? "Exportando..." : "Exportar SQL (pg_dump)"}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-md border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" /> Restaurar respaldo
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Reemplaza <span className="font-semibold text-foreground">todo</span> el contenido actual de la base de datos por el del archivo. No se puede deshacer — use esto solo para recuperar ante un desastre, nunca como prueba.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="archivo-respaldo">Archivo de respaldo (.json)</Label>
            <Input
              id="archivo-respaldo"
              type="file"
              accept="application/json"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmacion-restore">
              Escriba <span className="font-mono text-destructive">{FRASE_CONFIRMACION}</span> para confirmar
            </Label>
            <Input
              id="confirmacion-restore"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              placeholder={FRASE_CONFIRMACION}
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleRestaurar}
            disabled={!archivo || confirmacion !== FRASE_CONFIRMACION || restaurando}
          >
            <Upload className="mr-2 h-4 w-4" />
            {restaurando ? "Restaurando..." : "Restaurar y reemplazar todo"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
