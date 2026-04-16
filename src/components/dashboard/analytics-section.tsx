"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AlertTriangle, TrendingDown } from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts"

const attendanceBySubject = [
  { subject: "Matemáticas I", attendance: 82, fill: "#4CAF50" },
  { subject: "Física II", attendance: 78, fill: "#4CAF50" },
  { subject: "Química", attendance: 71, fill: "#EF5350" },
  { subject: "Programación", attendance: 89, fill: "#4CAF50" },
  { subject: "Cálculo III", attendance: 74, fill: "#EF5350" },
  { subject: "Base de Datos", attendance: 85, fill: "#4CAF50" },
]

const studentsAtRisk = [
  {
    id: 1,
    name: "Roberto Méndez",
    initials: "RM",
    subject: "Química Orgánica",
    attendance: 68,
    remaining: 3,
  },
  {
    id: 2,
    name: "Laura Jiménez",
    initials: "LJ",
    subject: "Cálculo III",
    attendance: 72,
    remaining: 5,
  },
  {
    id: 3,
    name: "Pedro Ramírez",
    initials: "PR",
    subject: "Física II",
    attendance: 70,
    remaining: 4,
  },
  {
    id: 4,
    name: "Carmen Flores",
    initials: "CF",
    subject: "Matemáticas I",
    attendance: 73,
    remaining: 6,
  },
  {
    id: 5,
    name: "Juan Torres",
    initials: "JT",
    subject: "Estadística",
    attendance: 69,
    remaining: 2,
  },
]

const chartConfig = {
  attendance: {
    label: "Asistencia %",
    color: "#1A237E",
  },
} satisfies ChartConfig

export function AnalyticsSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Attendance Chart - Takes 3 columns */}
      <Card className="shadow-md lg:col-span-3">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-foreground">
              Asistencia por Unidad Curricular
            </CardTitle>
            <Badge variant="outline" className="text-muted-foreground">
              Semestre actual
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            La línea roja indica el umbral mínimo del 75%
          </p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={attendanceBySubject}
              layout="vertical"
              margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis 
                type="category" 
                dataKey="subject" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value) => [`${value}%`, "Asistencia"]}
              />
              <ReferenceLine x={75} stroke="#EF5350" strokeWidth={2} strokeDasharray="5 5" />
              <Bar 
                dataKey="attendance" 
                radius={[0, 4, 4, 0]}
                fill="#1A237E"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Students at Risk - Takes 2 columns */}
      <Card className="shadow-md lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#EF5350]" />
            <CardTitle className="text-xl font-semibold text-foreground">
              Estudiantes en Riesgo
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Próximos a caer debajo del 75%
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentsAtRisk.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#EF5350]/10 text-[#EF5350] text-sm font-medium">
                    {student.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground truncate">{student.name}</p>
                    <Badge 
                      variant="outline" 
                      className="shrink-0 text-[#EF5350] border-[#EF5350]/30"
                    >
                      <TrendingDown className="mr-1 h-3 w-3" />
                      {student.attendance}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{student.subject}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress 
                      value={student.attendance} 
                      className="h-2 flex-1"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {student.remaining} faltas restantes
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
