"use client"

import { useState } from "react"
import { UserPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AddUserModal() {
  const [open, setOpen] = useState(false)
  const [userType, setUserType] = useState("student")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md">
          <UserPlus className="mr-2 h-4 w-4" />
          Agregar Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">Agregar Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Complete la información para registrar un nuevo estudiante o docente.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={userType} onValueChange={setUserType} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">Estudiante</TabsTrigger>
            <TabsTrigger value="professor">Docente</TabsTrigger>
          </TabsList>

          <TabsContent value="student" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input id="firstName" placeholder="María" className="bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input id="lastName" placeholder="González" className="bg-secondary" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">Cédula de Identidad</Label>
              <Input id="studentId" placeholder="V-12345678" className="bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" placeholder="estudiante@universidad.edu" className="bg-secondary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="faculty">Facultad</Label>
                <Select>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engineering">Ingeniería</SelectItem>
                    <SelectItem value="sciences">Ciencias</SelectItem>
                    <SelectItem value="computing">Informática</SelectItem>
                    <SelectItem value="humanities">Humanidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semestre</Label>
                <Select>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                      <SelectItem key={sem} value={String(sem)}>
                        {sem}° Semestre
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="professor" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profFirstName">Nombre</Label>
                <Input id="profFirstName" placeholder="Carlos" className="bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profLastName">Apellido</Label>
                <Input id="profLastName" placeholder="Rodríguez" className="bg-secondary" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profId">Cédula de Identidad</Label>
              <Input id="profId" placeholder="V-9876543" className="bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profEmail">Correo Electrónico</Label>
              <Input id="profEmail" type="email" placeholder="docente@universidad.edu" className="bg-secondary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Select>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">Matemáticas</SelectItem>
                    <SelectItem value="physics">Física</SelectItem>
                    <SelectItem value="chemistry">Química</SelectItem>
                    <SelectItem value="computing">Computación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Select>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lic">Lic.</SelectItem>
                    <SelectItem value="ing">Ing.</SelectItem>
                    <SelectItem value="msc">MSc.</SelectItem>
                    <SelectItem value="phd">Dr.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Guardar Usuario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
