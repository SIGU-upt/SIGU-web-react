"use client"

import { Users, BookOpen, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const stats = [
  {
    title: "Total Estudiantes",
    value: "2,847",
    change: "",
    changeType: "positive" as const,
    icon: Users,
    iconBg: "bg-primary",
    iconColor: "text-primary-foreground",
  },
  {
    title: "Clases Activas Hoy",
    value: "24",
    change: "De 32 programadas",
    changeType: "neutral" as const,
    icon: BookOpen,
    iconBg: "bg-[#4CAF50]",
    iconColor: "text-white",
  },
  {
    title: "Alertas de Deserción",
    value: "156",
    change: "Asistencia < 75%",
    changeType: "negative" as const,
    icon: AlertTriangle,
    iconBg: "bg-[#EF5350]",
    iconColor: "text-white",
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                {stat.change && (
                  <p className={`text-xs ${
                    stat.changeType === "positive" 
                      ? "text-[#4CAF50]" 
                      : stat.changeType === "negative" 
                      ? "text-[#EF5350]" 
                      : "text-muted-foreground"
                  }`}>
                    {stat.change}
                  </p>
                )}
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.iconBg}`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
