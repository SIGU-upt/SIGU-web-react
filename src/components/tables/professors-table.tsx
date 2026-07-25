import {
  Search,
  MoreVertical,
  Edit,
  GraduationCap,
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

interface Professor {
  id: string | number
  name: string
  initials: string
  idNumber: string
  email: string
  subjects: string[]
  status: string
}

interface ProfessorsTableProps {
  data: Professor[]
  loading: boolean
  onImport: (file: File) => Promise<any>
  onCreate: () => void
  onEdit: (item: Professor) => void
  onDelete: (item: Professor) => void
  onResetDevice: (item: Professor) => void
  canEdit: boolean
  canResetDevice: boolean
  canDelete: boolean
  // Búsqueda y paginación resueltas por el servidor (?q=, page, meta).
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function ProfessorsTable({ data, loading, onImport, onCreate, onEdit, onDelete, onResetDevice, canEdit, canResetDevice, canDelete, searchQuery, onSearchQueryChange, currentPage, totalPages, totalItems, onPageChange }: ProfessorsTableProps) {
  const itemsPerPage = 20
  const startIndex = (currentPage - 1) * itemsPerPage

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
            {canEdit && (
              <ImportModal
                onImport={onImport}
                title="Importar Docentes"
                description="Seleccione un archivo .xlsx con la lista de docentes"
                buttonLabel="Cargar Docentes"
                templateHeaders={["ci", "nombres", "apellidos", "email"]}
                templateFilename="plantilla-docentes.csv"
              />
            )}
            {canEdit && (
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={onCreate}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Nuevo Docente
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50 bg-muted/20 -mx-6 px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
            <Input
              placeholder="Buscar por nombre, cédula o correo..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
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
                <TableHead className="font-semibold text-foreground">U.Cs Asignadas</TableHead>
                <TableHead className="font-semibold text-foreground">Estado</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : data.length > 0 ? (
                data.map((item) => (
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
                          {item.subjects.length === 1 ? "U.C" : "U.Cs"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit || canResetDevice || canDelete ? (
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
                                Editar Datos
                              </DropdownMenuItem>
                            )}
                            {canResetDevice && (
                              <DropdownMenuItem onClick={() => onResetDevice(item)}>
                                <SmartphoneNfc className="mr-2 h-4 w-4" />
                                Reiniciar Dispositivo
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
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
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
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
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={startIndex + itemsPerPage}
          onPageChange={onPageChange}
          label="docentes"
        />
      </CardContent>
    </Card>
  )
}
