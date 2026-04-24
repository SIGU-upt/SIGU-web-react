import { useState } from "react"
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  Mail, 
  BookOpen, 
  GraduationCap, 
  Fingerprint, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ImportProfessorsModal } from "./import-professors-modal"
import { cn } from "@/lib/utils"

const initialData = [
  {
    id: 1,
    name: "Dr. Ricardo Méndez",
    initials: "RM",
    idNumber: "V-10.234.567",
    email: "r.mendez@universidad.edu",
    subjects: ["Cálculo III", "Álgebra Lineal", "Matemática Discreta"],
    status: "Activo",
  },
  {
    id: 2,
    name: "MSc. Laura Martínez",
    initials: "LM",
    idNumber: "V-12.876.543",
    email: "l.martinez@universidad.edu",
    subjects: ["Física Cuántica", "Termodinámica"],
    status: "Activo",
  },
  {
    id: 3,
    name: "Ing. Carlos Torres",
    initials: "CT",
    idNumber: "V-15.432.109",
    email: "c.torres@universidad.edu",
    subjects: ["Estructura de Datos", "Algoritmos II"],
    status: "Permiso",
  },
  {
    id: 4,
    name: "Dra. Elena Rivas",
    initials: "ER",
    idNumber: "V-9.543.210",
    email: "e.rivas@universidad.edu",
    subjects: ["Química Orgánica II"],
    status: "Activo",
  },
  {
    id: 5,
    name: "Prof. Juan Pérez",
    initials: "JP",
    idNumber: "V-11.222.333",
    email: "j.perez@universidad.edu",
    subjects: ["Historia Universitaria", "Ética"],
    status: "Activo",
  },
  {
    id: 6,
    name: "Dra. María Soto",
    initials: "MS",
    idNumber: "V-14.555.666",
    email: "m.soto@universidad.edu",
    subjects: ["Programación I", "Bases de Datos"],
    status: "Activo",
  },
  {
    id: 7,
    name: "MSc. Roberto Díaz",
    initials: "RD",
    idNumber: "V-8.444.222",
    email: "r.diaz@universidad.edu",
    subjects: ["Sistemas Operativos"],
    status: "Activo",
  },
  {
    id: 8,
    name: "Ing. Patricia Luna",
    initials: "PL",
    idNumber: "V-16.777.888",
    email: "p.luna@universidad.edu",
    subjects: ["Redes de Computadoras", "Seguridad Informática"],
    status: "Activo",
  },
  {
    id: 9,
    name: "Dr. Fernando Gómez",
    initials: "FG",
    idNumber: "V-7.111.000",
    email: "f.gomez@universidad.edu",
    subjects: ["Investigación de Operaciones"],
    status: "Jubilado",
  },
  {
    id: 10,
    name: "MSc. Sofía Castro",
    initials: "SC",
    idNumber: "V-18.999.000",
    email: "s.castro@universidad.edu",
    subjects: ["Inteligencia Artificial", "Machine Learning"],
    status: "Activo",
  },
  {
    id: 11,
    name: "Ing. Luis Blanco",
    initials: "LB",
    idNumber: "V-13.333.111",
    email: "l.blanco@universidad.edu",
    subjects: ["Arquitectura del Computador"],
    status: "Activo",
  },
  {
    id: 12,
    name: "Dra. Ana Beltrán",
    initials: "AB",
    idNumber: "V-17.222.555",
    email: "a.beltran@universidad.edu",
    subjects: ["Metodología de la Investigación"],
    status: "Activo",
  },
]

export function ProfessorsTable() {
  const [data, setData] = useState(initialData)
  const [searchQuery, setSearchQuery] = useState("")
  const [idFilter, setIdFilter] = useState("")
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredData = data.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesId = item.idNumber.toLowerCase().includes(idFilter.toLowerCase())

    return matchesSearch && matchesId
  })

  // Cálculos de paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const handleImport = (newData: any[]) => {
    const formattedData = newData.map((row, index) => ({
      id: data.length + index + 1,
      name: row.Nombre || row.name || "Sin Nombre",
      initials: (row.Nombre || "SN").split(" ").map((n: string) => n[0]).join("").toUpperCase(),
      idNumber: String(row.Identificacion || row.documento || row.Documento || "N/A"),
      email: row.Email || row.email || "N/A",
      subjects: typeof row.Materias === "string" ? row.Materias.split(",").map((s: string) => s.trim()) : [row.Materias],
      status: row.Estatus || "Activo"
    }))

    setData([...data, ...formattedData])
    setCurrentPage(1) // Volver a la primera página tras importar
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">
              Directorio de Docentes
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gestión de personal académico y asignación de carga horaria
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ImportProfessorsModal onImport={handleImport} />
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <GraduationCap className="mr-2 h-4 w-4" />
              Nuevo Docente
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50 bg-muted/20 -mx-6 px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
            <Input
              placeholder="Buscar por nombre o materia..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10 bg-background border-border shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="relative w-72">
            <Fingerprint className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
            <Input
              placeholder="Filtrar por documento..."
              value={idFilter}
              onChange={(e) => {
                setIdFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10 bg-background border-border shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-foreground">Docente</TableHead>
                <TableHead className="font-semibold text-foreground">Documento</TableHead>
                <TableHead className="font-semibold text-foreground">Materias Asignadas</TableHead>
                <TableHead className="font-semibold text-foreground">Estatus</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {item.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground leading-none">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.idNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className="h-7 w-7 rounded-full flex items-center justify-center p-0 bg-primary/10 text-primary border-primary/20 font-bold"
                        >
                          {item.subjects.length}
                        </Badge>
                        <span className="text-sm text-muted-foreground font-medium">
                          {item.subjects.length === 1 ? "Materia" : "Materias"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge className={item.status === "Activo" ? "bg-success hover:bg-success/90" : "bg-warning text-warning-foreground"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Enviar Correo
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Datos
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                    No se encontraron resultados para los filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 border-t border-border/50 pt-6 gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-background px-3 py-2 rounded-lg border border-border shadow-sm">
              Página <span className="text-primary font-bold">{currentPage}</span> de <span className="text-primary font-bold">{totalPages || 1}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-background px-3 py-2 rounded-lg border border-border shadow-sm">
              Mostrando <span className="text-primary font-bold">
                {filteredData.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, filteredData.length)}
              </span> de <span className="text-primary font-bold">{filteredData.length}</span> docentes
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 font-medium",
                    currentPage === page ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
                  )}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
