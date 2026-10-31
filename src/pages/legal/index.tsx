import { Link, useLocation } from "react-router-dom"
import { ShieldCheck, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

// Página pública simple (sin pretensión de texto legal definitivo, se marca
// así explícitamente), servida tanto en /privacidad como en /terminos — la
// pestaña inicial depende de cuál de las dos rutas trajo al usuario.
export function LegalPage() {
  const location = useLocation()
  const tabInicial = location.pathname === '/terminos' ? 'terminos' : 'privacidad'

  return (
    <div className="min-h-screen bg-background p-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-bold tracking-tight">SIGU</span>
          </div>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Privacidad y Términos de Uso</CardTitle>
            <p className="text-sm text-muted-foreground">
              UPT José Félix Ribas, Núcleo Socopó · Última actualización: 31 de octubre de 2026
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-6 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              Esta es una versión inicial, redactada en lenguaje simple, pensada para que el usuario sepa
              con claridad qué datos maneja el sistema. No sustituye una revisión legal formal de la
              institución, que puede ampliarla más adelante.
            </div>

            <Tabs defaultValue={tabInicial}>
              <TabsList>
                <TabsTrigger value="privacidad">Política de Privacidad</TabsTrigger>
                <TabsTrigger value="terminos">Términos de Uso</TabsTrigger>
              </TabsList>

              <TabsContent value="privacidad" className="prose-sm mt-4 space-y-5 text-sm leading-relaxed text-foreground">
                <section>
                  <h3 className="font-semibold text-base mb-1">1. Qué datos recopila SIGU</h3>
                  <p>Para poder llevar el control académico y de asistencia, el sistema guarda:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>Datos de identificación: nombres, apellidos, cédula de identidad y, de los alumnos, fecha de nacimiento.</li>
                    <li>Datos de contacto: correo electrónico institucional.</li>
                    <li>Credenciales de acceso: su contraseña, nunca almacenada en texto plano (se guarda cifrada).</li>
                    <li>Datos académicos: sede, PNF, trayecto, secciones, materias, inscripciones y matrícula.</li>
                    <li>Registros de asistencia: fecha, hora y estado (presente, retardo, justificado) de cada clase.</li>
                    <li>Evidencia de justificación de inasistencia, cuando el usuario decide adjuntarla (ej. un documento o imagen).</li>
                    <li>Un identificador técnico del teléfono (no un dato personal del usuario) para la app móvil, usado solo para evitar que la cuenta se use desde varios dispositivos a la vez.</li>
                    <li>Bitácora técnica de seguridad: intentos de inicio de sesión, dirección IP y acciones sensibles, para poder investigar fraudes o accesos indebidos.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-1">2. Para qué se usan</h3>
                  <p>
                    Exclusivamente para la gestión académica de la institución: llevar el control de asistencia,
                    generar reportes de rendimiento, comunicarse con el usuario (ej. recuperación de contraseña,
                    avisos de clase) y mantener la seguridad del sistema. No se usan con fines publicitarios ni
                    se venden ni ceden a terceros ajenos a la institución.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-1">3. Quién puede ver sus datos</h3>
                  <p>
                    Solo el personal autorizado según su rol dentro del sistema: por ejemplo, un coordinador ve
                    únicamente los datos de su propia carrera y sede, nunca los de otra institución o sede ajena.
                    Un docente ve solo a los alumnos inscritos en sus propias clases. El acceso queda registrado.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-1">4. Cuánto tiempo se conservan</h3>
                  <p>
                    Mientras el usuario mantenga relación con la institución (como estudiante, docente o personal
                    administrativo). SIGU no elimina físicamente los registros académicos al dar de baja a alguien
                    (para no perder el historial), pero sí deja de mostrarlos en el uso normal del sistema.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-1">5. Seguridad</h3>
                  <p>
                    Las contraseñas se guardan cifradas (nunca en texto plano), toda comunicación con el servidor
                    viaja cifrada (HTTPS), y el acceso a cada dato está limitado según el rol y la jurisdicción de
                    quien consulta.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-1">6. Sus derechos</h3>
                  <p>
                    Puede solicitar revisar o corregir sus datos personales (por ejemplo, un correo mal escrito)
                    dirigiéndose a la coordinación de su carrera o a la administración de su sede.
                  </p>
                </section>
              </TabsContent>

              <TabsContent value="terminos" className="prose-sm mt-4 space-y-5 text-sm leading-relaxed text-foreground">
                <section>
                  <h3 className="font-semibold text-base mb-1">1. Aceptación</h3>
                  <p>
                    Al usar el panel web o la aplicación móvil de SIGU con una cuenta activa, usted acepta estos
                    términos de uso y la Política de Privacidad descrita en la pestaña anterior.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-1">2. Qué es SIGU</h3>
                  <p>
                    Un sistema de gestión académica de la UPT José Félix Ribas, Núcleo Socopó: matrícula,
                    horarios, asistencia por código QR y reportes. Se encuentra en una etapa inicial de uso
                    (MVP): es posible que tenga limitaciones conocidas o interrupciones puntuales mientras se
                    sigue desarrollando.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-1">3. Su cuenta</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Es responsable de mantener su contraseña en privado y no compartirla con nadie.</li>
                    <li>No debe usar la cuenta de otra persona ni permitir que otra persona use la suya.</li>
                    <li>En la app móvil, cada cuenta queda vinculada a un solo teléfono a la vez, como medida de seguridad contra el uso compartido de cuentas.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-1">4. Uso del código QR de asistencia</h3>
                  <p>
                    El código que genera el docente para tomar asistencia es personal e intransferible dentro de
                    esa clase: compartirlo, fotografiarlo para que otra persona lo use, o intentar registrar
                    asistencia de forma fraudulenta es una falta que puede derivar en una sanción académica según
                    el reglamento de la institución, independientemente de lo que el sistema detecte técnicamente.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-1">5. Qué no está permitido</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Intentar acceder a datos o funciones que no le correspondan por su rol.</li>
                    <li>Usar el sistema para fines distintos a la gestión académica de la institución.</li>
                    <li>Intentar interferir con el funcionamiento normal del sistema.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-1">6. Cambios a estos términos</h3>
                  <p>
                    La institución puede actualizar este documento conforme el sistema evolucione. Los cambios
                    importantes se avisarán dentro de la propia aplicación.
                  </p>
                </section>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
