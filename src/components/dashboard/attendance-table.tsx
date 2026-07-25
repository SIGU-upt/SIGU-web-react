"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Search, MoreVertical, FileBarChart } from "lucide-react"
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
import api from "@/config/api"

interface AttendanceRow {
  id: string
  alumnoId: string
  student: string
  initials: string
  subject: string
  date: string
  estado: string
}

const getStatusBadge = (estado: string) => {
  switch (estado) {
    case "PRESENTE":
      return <Badge className="bg-success text-success-foreground hover:bg-success/90">Presente</Badge>
    case "RETARDO":
      return <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">Retardo</Badge>
    case "JUSTIFICADO":
      return <Badge className="bg-secondary text-secondary-foreground">Justificado</Badge>
    default:
      return <Badge variant="secondary">{estado}</Badge>
  }
}

export function AttendanceTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [data, setData] = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/attendance', { params: { limit: 10 } })
      .then((res) => {
        const list = res.data.data ?? res.data
        setData((Array.isArray(list) ? list : []).map((a: any) => ({
          id: a.id,
          alumnoId: a.alumnoId,
          student: a.alumno?.nombreCompleto ?? '—',
          initials: (a.alumno?.nombres?.charAt(0) ?? '') + (a.alumno?.apellidos?.charAt(0) ?? ''),
          subject: a.clase?.unidadCurricular?.nombre ?? '—',
          date: a.fecha,
          estado: a.estado,
        })))
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredData = data.filter((item) =>
    item.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">
            Actividad de Asistencia Reciente
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 bg-secondary"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-muted-foreground py-10">Cargando asistencia...</div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-foreground">Estudiante</TableHead>
                  <TableHead className="font-semibold text-foreground">Unidad Curricular</TableHead>
                  <TableHead className="font-semibold text-foreground">Fecha</TableHead>
                  <TableHead className="font-semibold text-foreground">Estado</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                              {item.initials}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium text-foreground">{item.student}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{item.subject}</TableCell>
                      <TableCell className="text-muted-foreground">{item.date}</TableCell>
                      <TableCell>{getStatusBadge(item.estado)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/reportes?tab=alumno&alumnoId=${item.alumnoId}`}>
                                <FileBarChart className="mr-2 h-4 w-4" />
                                Ver reporte del alumno
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                      No hay registros de asistencia recientes.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
