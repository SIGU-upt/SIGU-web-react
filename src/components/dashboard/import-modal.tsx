import { useState } from "react"
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ImportResult {
  creados: number
  actualizados: number
  cohortesAsignadas: number
  inscripcionesCreadas: number
  errores: { fila: number; ci: string; motivo: string }[]
}

interface ImportModalProps {
  onImport: (file: File) => Promise<ImportResult>
  title: string
  description: string
  buttonLabel: string
}

export function ImportModal({ onImport, title, description, buttonLabel }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
      setStatus("idle")
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setStatus("uploading")
    setErrorMsg("")

    try {
      const r = await onImport(file)
      setResult(r)
      setStatus("success")
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Error al procesar el archivo")
      setStatus("error")
    }
  }

  return (
    <Dialog onOpenChange={(open) => { if (!open) { setStatus("idle"); setResult(null); setFile(null) } }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/5 shadow-sm">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Carga Masiva (Excel)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="excel-file">Seleccionar Archivo</Label>
            <Input id="excel-file" type="file" accept=".xlsx, .xls" onChange={handleFileChange}
              className="bg-secondary cursor-pointer file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-4" />
          </div>

          {status === "success" && result && (
            <div className="space-y-2 p-3 rounded-lg bg-success/10 text-success border border-success/20">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /><p className="font-medium">Importación completada</p></div>
              <div className="text-sm space-y-1 ml-7">
                <p>Creados: {result.creados}</p>
                <p>Actualizados: {result.actualizados}</p>
                <p>Cohortes asignadas: {result.cohortesAsignadas}</p>
                <p>Inscripciones creadas: {result.inscripcionesCreadas}</p>
                {result.errores.length > 0 && <p className="text-destructive">Errores: {result.errores.length}</p>}
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{errorMsg}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleUpload} disabled={!file || status === "uploading" || status === "success"} className="w-full bg-primary hover:bg-primary/90">
            {status === "uploading" ? "Procesando..." : status === "success" ? "Carga Finalizada" : buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
