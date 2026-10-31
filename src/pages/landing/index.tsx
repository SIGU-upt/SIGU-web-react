import { useState } from "react"
import { Link } from "react-router-dom"
import {
  GraduationCap,
  QrCode,
  BarChart3,
  ShieldCheck,
  Smartphone,
  Download,
  ShieldCheck as ShieldIcon,
} from "lucide-react"
import { SiGithub, SiFlutter, SiDart } from "react-icons/si"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

const APP_REPO_URL = "https://github.com/SIGU-upt/SIGU-app-flutter"
const APP_DOWNLOAD_URL =
  import.meta.env.VITE_APP_DOWNLOAD_URL ||
  "https://github.com/SIGU-upt/sigu-app-releases/releases/download/v1.0.0/SIGU.apk"
const APK_VIRUSTOTAL_URL =
  "https://www.virustotal.com/gui/file/94cd5e83c55e00b100f182c6c2273715907685bf272c30c39cca6a39cfad4909"

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
  const [descargaAbierta, setDescargaAbierta] = useState(false)

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
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Iniciar sesión
              </Button>
            </Link>
          </div>
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
              ¿Es estudiante o docente?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Descargue la aplicación móvil de SIGU para registrar y controlar la asistencia de
              sus clases desde su teléfono.
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setDescargaAbierta(true)}
              >
                <Download className="h-5 w-5" />
                Descargar la aplicación (APK)
              </Button>
            </div>

            <Dialog open={descargaAbierta} onOpenChange={setDescargaAbierta}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Descargar la aplicación SIGU</DialogTitle>
                  <DialogDescription>
                    Antes de instalar un APK fuera de una tienda oficial, se recomienda verificar
                    el archivo. Puede revisar el análisis público en VirusTotal (0 de 68
                    antivirus lo marcan como malicioso).
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col gap-2 sm:flex-col">
                  <a href={APP_DOWNLOAD_URL} className="w-full">
                    <Button className="w-full">
                      <Download className="h-4 w-4" />
                      Descargar APK
                    </Button>
                  </a>
                  <a href={APK_VIRUSTOTAL_URL} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="outline" className="w-full">
                      <ShieldIcon className="h-4 w-4" />
                      Ver análisis en VirusTotal
                    </Button>
                  </a>
                  <div className="flex items-center justify-center gap-4 pt-2 text-muted-foreground">
                    <a
                      href={APP_REPO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Código fuente en GitHub"
                      className="hover:text-foreground"
                    >
                      <SiGithub className="h-5 w-5" />
                    </a>
                    <a
                      href="https://flutter.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Hecho con Flutter"
                      className="hover:text-foreground"
                    >
                      <SiFlutter className="h-5 w-5" />
                    </a>
                    <a
                      href="https://dart.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Hecho con Dart"
                      className="hover:text-foreground"
                    >
                      <SiDart className="h-5 w-5" />
                    </a>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground space-y-1">
        <p>© 2026 Universidad • Sistema de Gestión Universitaria</p>
        <p className="text-xs">
          <Link to="/privacidad" className="hover:underline">Privacidad</Link>
          {' · '}
          <Link to="/terminos" className="hover:underline">Términos de uso</Link>
        </p>
      </footer>
    </div>
  )
}
