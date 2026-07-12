import { useState } from "react"
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  BookOpen, 
  Layers, 
  Download,
  Plus,
  Trash2,
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
import { PaginationControls } from "@/components/ui/pagination-controls"
import { StatusBadge } from "@/components/ui/status-badge"

interface CurriculumUnit {
  id: string | number
  code: string
  name: string
  credits: number
  semester: number
  type: "Obligatoria" | "Electiva"
  status: "Activa" | "Inactiva"
}

interface CurriculumUnitsTableProps {
  data: CurriculumUnit[]
  onCreate?: () => void
  onEdit?: (item: CurriculumUnit) => void
  onDelete?: (item: CurriculumUnit) => void
  canEdit?: boolean
  canDelete?: boolean
}

export function CurriculumUnitsTable({ data, onCreate, onEdit, onDelete, canEdit, canDelete }: CurriculumUnitsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredData = data.filter((item) => {
    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Unidades Curriculares
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Catálogo de asignaturas y créditos académicos del programa
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/5 shadow-sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar Pensum
            </Button>
            {canEdit && (
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={onCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva U.C
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50 bg-muted/20 -mx-6 px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
            <Input
              placeholder="Buscar por código o nombre de U.C..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
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
                <TableHead className="font-semibold text-foreground w-[120px]">Código</TableHead>
                <TableHead className="font-semibold text-foreground">Unidad Curricular</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Créditos</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Semestre</TableHead>
                <TableHead className="font-semibold text-foreground">Tipo</TableHead>
                <TableHead className="font-semibold text-foreground">Estatus</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {item.code}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">{item.name}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground font-bold">
                        {item.credits}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Layers className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{item.semester}°</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.type} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit?.(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar U.C
                            </DropdownMenuItem>
                            {canDelete && (
                              <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(item)}>
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
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                    No se encontraron unidades curriculares.
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
          label="U.Cs"
        />
      </CardContent>
    </Card>
  )
}
