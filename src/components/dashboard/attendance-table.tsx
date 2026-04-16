"use client"

import { useState } from "react"
import { Search, Filter, MoreHorizontal, Eye, Edit, MessageSquare } from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const attendanceData = [
  {
    id: 1,
    student: "María González",
    initials: "MG",
    subject: "Matemáticas I",
    faculty: "Ingeniería",
    date: "2026-03-30",
    time: "08:00",
    status: "Presente",
  },
  {
    id: 2,
    student: "Carlos Rodríguez",
    initials: "CR",
    subject: "Física II",
    faculty: "Ciencias",
    date: "2026-03-30",
    time: "09:30",
    status: "Ausente",
  },
  {
    id: 3,
    student: "Ana Martínez",
    initials: "AM",
    subject: "Programación I",
    faculty: "Ingeniería",
    date: "2026-03-30",
    time: "10:00",
    status: "Justificado",
  },
  {
    id: 4,
    student: "Luis Pérez",
    initials: "LP",
    subject: "Cálculo III",
    faculty: "Ingeniería",
    date: "2026-03-30",
    time: "11:00",
    status: "Presente",
  },
  {
    id: 5,
    student: "Sofia Hernández",
    initials: "SH",
    subject: "Química Orgánica",
    faculty: "Ciencias",
    date: "2026-03-30",
    time: "14:00",
    status: "Ausente",
  },
  {
    id: 6,
    student: "Diego Sánchez",
    initials: "DS",
    subject: "Base de Datos",
    faculty: "Informática",
    date: "2026-03-30",
    time: "15:30",
    status: "Presente",
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Presente":
      return <Badge className="bg-[#4CAF50] text-white hover:bg-[#43A047]">Presente</Badge>
    case "Ausente":
      return <Badge className="bg-[#EF5350] text-white hover:bg-[#E53935]">Ausente</Badge>
    case "Justificado":
      return <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">Justificado</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function AttendanceTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [facultyFilter, setFacultyFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")

  const filteredData = attendanceData.filter((item) => {
    const matchesSearch = item.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFaculty = facultyFilter === "all" || item.faculty === facultyFilter
    return matchesSearch && matchesFaculty
  })

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">
            Actividad de Asistencia Reciente
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 bg-secondary"
              />
            </div>
            
            {/* Faculty Filter */}
            <Select value={facultyFilter} onValueChange={setFacultyFilter}>
              <SelectTrigger className="w-40 bg-secondary">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Facultad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Ingeniería">Ingeniería</SelectItem>
                <SelectItem value="Ciencias">Ciencias</SelectItem>
                <SelectItem value="Informática">Informática</SelectItem>
              </SelectContent>
            </Select>

            {/* Semester Filter */}
            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger className="w-40 bg-secondary">
                <SelectValue placeholder="Semestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="1">1er Semestre</SelectItem>
                <SelectItem value="2">2do Semestre</SelectItem>
                <SelectItem value="3">3er Semestre</SelectItem>
                <SelectItem value="4">4to Semestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-foreground">Estudiante</TableHead>
                <TableHead className="font-semibold text-foreground">Unidad Curricular</TableHead>
                <TableHead className="font-semibold text-foreground">Fecha</TableHead>
                <TableHead className="font-semibold text-foreground">Hora</TableHead>
                <TableHead className="font-semibold text-foreground">Estatus</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {item.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{item.student}</p>
                        <p className="text-xs text-muted-foreground">{item.faculty}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{item.subject}</TableCell>
                  <TableCell className="text-muted-foreground">{item.date}</TableCell>
                  <TableCell className="text-muted-foreground">{item.time}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar Estatus
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Enviar Notificación
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
