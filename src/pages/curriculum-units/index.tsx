import { useState } from "react"
import { CurriculumUnitsTable } from "@/components/tables/curriculum-units-table"

const initialData: any[] = [
  {
    id: 1,
    code: "MAT-101",
    name: "Cálculo I",
    credits: 4,
    semester: 1,
    type: "Obligatoria",
    status: "Activa",
  },
  {
    id: 2,
    code: "FIS-101",
    name: "Física I",
    credits: 4,
    semester: 2,
    type: "Obligatoria",
    status: "Activa",
  },
  {
    id: 3,
    code: "PRO-101",
    name: "Programación I",
    credits: 3,
    semester: 1,
    type: "Obligatoria",
    status: "Activa",
  },
  {
    id: 4,
    code: "IDM-101",
    name: "Inglés Técnico",
    credits: 2,
    semester: 3,
    type: "Electiva",
    status: "Activa",
  },
  {
    id: 5,
    code: "MAT-201",
    name: "Álgebra Lineal",
    credits: 3,
    semester: 2,
    type: "Obligatoria",
    status: "Activa",
  },
]

export function CurriculumUnitsPage() {
  const [data] = useState(initialData)

  return (
    <div className="space-y-6">
      <CurriculumUnitsTable data={data} />
    </div>
  )
}
