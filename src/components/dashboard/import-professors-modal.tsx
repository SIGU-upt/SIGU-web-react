import { useState } from "react"
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import * as XLSX from "xlsx"

interface ImportProfessorsModalProps {
  onImport: (data: any[]) => void
}

export function ImportProfessorsModal({ onImport }: ImportProfessorsModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [rowCount, setRowCount] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setStatus("idle")
    }
  }

  const handleUpload = () => {
    if (!file) return
    setStatus("uploading")

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)

        if (json.length > 0) {
          onImport(json)
          setRowCount(json.length)
          setStatus("success")
        } else {
          setStatus("error")
        }
      } catch (err) {
        console.error("Error al procesar el archivo:", err)
        setStatus("error")
      }
    }

    reader.onerror = () => {
      setStatus("error")
    }

    reader.readAsBinaryString(file)
  }

  return (
    <Dialog onOpenChange={(open) => !open && setStatus("idle")}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/5 shadow-sm">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Carga Masiva (Excel)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar Docentes
          </DialogTitle>
          <DialogDescription>
            Selecciona un archivo .xlsx o .csv con la lista de docentes para el registro masivo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="excel-file" className="text-sm font-medium">
              Seleccionar Archivo
            </Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="bg-secondary cursor-pointer file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-4 file:hover:bg-primary/90"
            />
          </div>

          {status === "success" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success border border-success/20 animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">¡Éxito! Se han importado {rowCount} docentes correctamente.</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 animate-in fade-in zoom-in duration-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">Error al procesar el archivo. Asegúrate de que el formato sea correcto.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleUpload} 
            disabled={!file || status === "uploading" || status === "success"}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {status === "uploading" ? "Procesando..." : status === "success" ? "Carga Finalizada" : "Cargar Docentes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
