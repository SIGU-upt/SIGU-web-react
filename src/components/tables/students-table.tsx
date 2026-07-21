import { useState } from "react"
import {
  Search,
  MoreVertical,
  Edit,
  Users,
  Fingerprint,
  Trash2,
  SmartphoneNfc,
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
import { ImportModal } from "@/components/dashboard/import-modal"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { StatusBadge } from "@/components/ui/status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Trayecto } from "@/types"

interface Student {
  id: string | number
  name: string
  initials: string
  idNumber: string
  email: string
  career: string
  semester: number
  status: string
}

interface StudentsTableProps {
  data: Student[]
  onImport: (file: File) => Promise<any>
  onCreate: () => void
  onEdit: (item: Student) => void
  onDelete: (item: Student) => void
  onResetDevice: (item: Student) => void
  canEdit: boolean
  canResetDevice: boolean
  trayectoOptions: Trayecto[]
  trayectoFilter: string
  onTrayectoFilterChange: (value: string) => void
}

export function StudentsTable({ data, onImport, onCreate, onEdit, onDelete, onResetDevice, canEdit, canResetDevice, trayectoOptions, trayectoFilter, onTrayectoFilterChange }: StudentsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [idFilter, setIdFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredData = data.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.career.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesId = item.idNumber.toLowerCase().includes(idFilter.toLowerCase())

    return matchesSearch && matchesId
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">
              Directorio de Estudiantes
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Consulta y gestión de la matrícula estudiantil
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ImportModal
              onImport={onImport}
              title="Importar Estudiantes"
              description="Seleccione un archivo .xlsx con la lista de estudiantes"
              buttonLabel="Cargar Estudiantes"
              templateHeaders={["ci", "nombres", "apellidos", "email", "trayecto", "clasesIds"]}
              templateFilename="plantilla-estudiantes.csv"
            />
            {canEdit && (
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={onCreate}>
                <Users className="mr-2 h-4 w-4" />
                Nuevo Estudiante
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50 bg-muted/20 -mx-6 px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
            <Input
              placeholder="Buscar por nombre o carrera..."
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
          <Select value={trayectoFilter || "__all__"} onValueChange={(v) => { onTrayectoFilterChange(v === "__all__" ? "" : v); setCurrentPage(1) }}>
            <SelectTrigger className="w-56 bg-background border-border shadow-sm">
              <SelectValue placeholder="Trayecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los trayectos</SelectItem>
              {trayectoOptions.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-foreground">Estudiante</TableHead>
                <TableHead className="font-semibold text-foreground">Documento</TableHead>
                <TableHead className="font-semibold text-foreground">Carrera</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Trayecto</TableHead>
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
                      <span className="text-sm font-medium text-foreground">{item.career}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-bold bg-secondary text-secondary-foreground">
                        {item.semester}°
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit || canResetDevice ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit && (
                              <DropdownMenuItem onClick={() => onEdit(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar Perfil
                              </DropdownMenuItem>
                            )}
                            {canResetDevice && (
                              <DropdownMenuItem onClick={() => onResetDevice(item)}>
                                <SmartphoneNfc className="mr-2 h-4 w-4" />
                                Reiniciar Dispositivo
                              </DropdownMenuItem>
                            )}
                            {canEdit && (
                              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(item)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">Solo lectura</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                    No se encontraron resultados para los filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationControls 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          startIndex={startIndex}
          endIndex={startIndex + itemsPerPage}
          onPageChange={setCurrentPage}
          label="estudiantes"
        />
      </CardContent>
    </Card>
  )
}
