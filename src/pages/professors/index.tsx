import { useState } from "react"
import { ProfessorsTable } from "@/components/tables/professors-table"

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

export function ProfessorsPage() {
  const [data, setData] = useState(initialData)

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
  }

  return (
    <div className="space-y-6">
      <ProfessorsTable data={data} onImport={handleImport} />
    </div>
  )
}
