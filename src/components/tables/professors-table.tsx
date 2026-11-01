import {
  Search,
  MoreVertical,
  Edit,
  GraduationCap,
  Trash2,
  SmartphoneNfc,
  KeyRound,
  Download,
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
import { ImportModal, type ImportResult } from "@/components/dashboard/import-modal"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { StatusBadge } from "@/components/ui/status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { TextoTruncado } from "@/components/ui/texto-truncado"
import { useAuth } from "@/contexts/AuthContext"

interface Professor {
  id: string | number
  name: string
  initials: string
  idNumber: string
  email: string
  subjects: string[]
  status: string
}

interface ProfessorsTableProps<T extends Professor> {
  data: T[]
  loading: boolean
  onImport: (file: File) => Promise<ImportResult>
  onExport: () => void
  onCreate: () => void
  onEdit: (item: T) => void
  onDelete: (item: T) => void
  onResetDevice: (item: T) => void
  onResetPassword: (item: T) => void
  canEdit: boolean
  canResetDevice: boolean
  canDelete: boolean
  // Filtros opcionales de ámbito. Cada select se muestra solo si se le pasan sus
  // opciones: superadmin/auditor reciben sede + PNF; rector solo PNF; coordinador ninguno.
  sedeOptions?: { id: string; label: string }[]
  sedeFilter?: string
  onSedeFilterChange?: (value: string) => void
  pnfOptions?: { id: string; label: string }[]
  pnfFilter?: string
  onPnfFilterChange?: (value: string) => void
  // Búsqueda y paginación resueltas por el servidor (?q=, page, meta).
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
  // Ordenamiento resuelto por el servidor (ver UsersService.findAll).
  orderBy?: 'apellidos' | 'ci' | 'email'
  orderDir?: 'ASC' | 'DESC'
  onToggleSort?: (key: 'apellidos' | 'ci' | 'email') => void
}

export function ProfessorsTable<T extends Professor>({ data, loading, onImport, onExport, onCreate, onEdit, onDelete, onResetDevice, onResetPassword, canEdit, canResetDevice, canDelete, sedeOptions, sedeFilter, onSedeFilterChange, pnfOptions, pnfFilter, onPnfFilterChange, searchQuery, onSearchQueryChange, currentPage, totalPages, totalItems, onPageChange, orderBy, orderDir, onToggleSort }: ProfessorsTableProps<T>) {
  const itemsPerPage = 20
  const startIndex = (currentPage - 1) * itemsPerPage

  // Mismo criterio que StudentsTable: un coordinador importa siempre dentro
  // de su propia sede-PNF (el backend ignora pnfCodigo para ese rol), así
  // que solo rector/superadmin necesitan ver esa columna en la plantilla.
  const { user } = useAuth()
  const necesitaPnfCodigo = !user?.sedePnfId
  const importHeaders = necesitaPnfCodigo
    ? ["ci", "nombres", "apellidos", "email", "pnfCodigo"]
    : ["ci", "nombres", "apellidos", "email"]
  const importDescription = necesitaPnfCodigo
    ? "Seleccione un archivo .xlsx con la lista de docentes. La columna pnfCodigo es el código del PNF (ej. PNFI, visible en Configuración → PNF) donde quedará asignado cada docente."
    : "Seleccione un archivo .xlsx con la lista de docentes"

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
          <div className="flex flex-wrap items-center gap-3" data-tour="docentes-acciones">
            <Button variant="outline" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            {canEdit && (
              <ImportModal
                onImport={onImport}
                title="Importar Docentes"
                description={importDescription}
                buttonLabel="Cargar Docentes"
                templateHeaders={importHeaders}
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

        <div className="flex flex-wrap items-center gap-4 py-4 border-y border-border/50 bg-muted/70 -mx-6 px-6" data-tour="docentes-filtros">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60 dark:text-primary" />
            <Input
              placeholder="Buscar por nombre, cédula o correo..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-10 bg-background border-border shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          {sedeOptions && onSedeFilterChange && (
            <Select value={sedeFilter || "__all__"} onValueChange={(v) => onSedeFilterChange(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-56 bg-background border-border shadow-sm">
                <SelectValue placeholder="Sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las sedes</SelectItem>
                {sedeOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {pnfOptions && onPnfFilterChange && (
            <Select value={pnfFilter || "__all__"} onValueChange={(v) => onPnfFilterChange(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-56 bg-background border-border shadow-sm">
                <SelectValue placeholder="PNF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los PNF</SelectItem>
                {pnfOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                {onToggleSort ? (
                  <>
                    <SortableTableHead sortKey="apellidos" sort={{ key: orderBy ?? null, direction: orderDir === 'DESC' ? 'desc' : 'asc' }} onSort={onToggleSort} className="font-semibold text-foreground">Docente</SortableTableHead>
                    <SortableTableHead sortKey="ci" sort={{ key: orderBy ?? null, direction: orderDir === 'DESC' ? 'desc' : 'asc' }} onSort={onToggleSort} className="font-semibold text-foreground">Documento</SortableTableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="font-semibold text-foreground">Docente</TableHead>
                    <TableHead className="font-semibold text-foreground">Documento</TableHead>
                  </>
                )}
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
                  <TableRow key={item.id} className="hover:bg-muted/70">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {item.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground leading-none"><TextoTruncado texto={item.name} /></p>
                          <p className="text-xs text-muted-foreground mt-1"><TextoTruncado texto={item.email} /></p>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Más acciones">
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
                            {canResetDevice && (
                              <DropdownMenuItem onClick={() => onResetPassword(item)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Generar contraseña temporal
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(item)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Deshabilitar
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
