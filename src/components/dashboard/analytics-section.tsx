"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

const chartConfig = {
  attendance: {
    label: "Asistencia %",
    color: "#1A237E",
  },
} satisfies ChartConfig

export function AnalyticsSection() {
  return (
    <div className="grid gap-6">
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-foreground">
              Asistencia por Unidad Curricular
            </CardTitle>
            <Badge variant="outline" className="text-muted-foreground">
              Trayecto actual
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
                width={120}
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
    </div>
  )
}
