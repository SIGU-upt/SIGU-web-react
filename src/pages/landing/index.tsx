import { Link } from "react-router-dom"
import {
  GraduationCap,
  QrCode,
  BarChart3,
  ShieldCheck,
  Github,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const APP_REPO_URL = "https://github.com/SIGU-upt/SIGU-app-flutter"

const CARACTERISTICAS = [
  {
    icon: QrCode,
    title: "Asistencia por código QR",
    description:
      "El docente abre la clase y genera un código QR que se renueva cada pocos segundos; el estudiante lo escanea desde la app para registrar su asistencia al instante.",
  },
  {
    icon: BarChart3,
    title: "Reportes en tiempo real",
    description:
      "Seguimiento del porcentaje de asistencia por estudiante y por clase, con el umbral institucional del 75% siempre visible.",
  },
  {
    icon: ShieldCheck,
    title: "Roles y jurisdicción",
    description:
      "Cada usuario ve y gestiona únicamente lo que le corresponde según su rol y su sede, con auditoría de seguridad en cada acción sensible.",
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">SIGU</span>
          </div>
          <Link to="/login">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Iniciar sesión
            </Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Sistema de Información para la Gestión Universitaria
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            SIGU centraliza el control de asistencia y la gestión académica de la UPT José Félix
            Ribas, Núcleo Socopó: matrícula, secciones, clases, reportes y asistencia por código
            QR, en un solo lugar para autoridades, coordinadores, docentes y estudiantes.
          </p>
          <div className="mt-8">
            <Link to="/login">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base font-semibold"
              >
                Iniciar sesión
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">
            ¿Cómo funciona?
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {CARACTERISTICAS.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border-border/50">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t border-border/50 bg-secondary/30">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center">
            <Smartphone className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              ¿Eres estudiante o docente?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Descarga la aplicación móvil de SIGU para registrar y controlar la asistencia de
              tus clases desde tu teléfono.
            </p>
            <div className="mt-6">
              <a href={APP_REPO_URL} target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base font-semibold"
                >
                  <Github className="h-5 w-5" />
                  Descargar la aplicación desde aquí
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        © 2026 Universidad • Sistema de Gestión Universitaria
      </footer>
    </div>
  )
}
