import { useState } from "react"
import { StudentsTable } from "@/components/tables/students-table"

const initialData = [
  {
    id: 1,
    name: "Ana García",
    initials: "AG",
    idNumber: "V-28.123.456",
    email: "a.garcia@est.universidad.edu",
    career: "Ingeniería en Informática",
    semester: 5,
    status: "Regular",
  },
  {
    id: 2,
    name: "Luis Rodríguez",
    initials: "LR",
    idNumber: "V-29.876.543",
    email: "l.rodriguez@est.universidad.edu",
    career: "Ingeniería en Informática",
    semester: 3,
    status: "Regular",
  },
  {
    id: 3,
    name: "Carla Pérez",
    initials: "CP",
    idNumber: "V-27.432.109",
    email: "c.perez@est.universidad.edu",
    career: "Administración",
    semester: 8,
    status: "Regular",
  },
  {
    id: 4,
    name: "Diego Martínez",
    initials: "DM",
    idNumber: "V-30.543.210",
    email: "d.martinez@est.universidad.edu",
    career: "Ingeniería Industrial",
    semester: 2,
    status: "Irregular",
  },
]

export function StudentsPage() {
  const [data, setData] = useState(initialData)

  const handleImport = (newData: any[]) => {
    const formattedData = newData.map((row, index) => ({
      id: data.length + index + 1,
      name: row.Nombre || row.name || "Sin Nombre",
      initials: (row.Nombre || "SN").split(" ").map((n: string) => n[0]).join("").toUpperCase(),
      idNumber: String(row.Identificacion || row.documento || row.Documento || "N/A"),
      email: row.Email || row.email || "N/A",
      career: row.Carrera || row.career || "N/A",
      semester: parseInt(row.Semestre || row.semester || "1"),
      status: row.Estatus || "Regular"
    }))

    setData([...data, ...formattedData])
  }

  return (
    <div className="space-y-6">
      <StudentsTable data={data} onImport={handleImport} />
    </div>
  )
}
