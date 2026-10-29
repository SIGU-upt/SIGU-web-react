import { useState, useEffect, useMemo } from "react"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { FormError } from "@/components/ui/form-error"
import type { ReplicarUcResultado, Trayecto, UnidadCurricular } from "@/types"
import { getErrorMessage } from "@/lib/errors"
import api from "@/config/api"

interface ReplicarUcModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  uc: UnidadCurricular | null
  // Se llama cuando se creó al menos una oferta, para refrescar el listado.
  onDone: () => void
}

// Ofrece una misma materia del catálogo en varios trayectos con una sola operación
// (POST /unidades-curriculares/replicar). Los trayectos donde la materia ya se
// ofrece se muestran marcados y no se pueden volver a elegir.
export function ReplicarUcModal({ open, onOpenChange, uc, onDone }: ReplicarUcModalProps) {
  const [trayectos, setTrayectos] = useState<Trayecto[]>([])
  const [ofrecidos, setOfrecidos] = useState<Set<string>>(new Set())
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [loadingDatos, setLoadingDatos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ReplicarUcResultado | null>(null)

  const ucCatalogoId = uc?.ucCatalogoId ?? uc?.catalogo?.id
  const nombre = uc?.catalogo?.nombre ?? uc?.nombre ?? ""

  useEffect(() => {
    if (!open || !ucCatalogoId) return
    setSeleccion(new Set())
    setResultado(null)
    setError(null)
    setLoadingDatos(true)
    Promise.all([
      api.get('/trayectos', { params: { limit: 200 } }),
      api.get(`/uc-catalogo/${ucCatalogoId}/ofertas`),
    ]).then(([trayectosRes, ofertasRes]) => {
      const lista = trayectosRes.data.data ?? trayectosRes.data
      const ofertas = ofertasRes.data.data ?? ofertasRes.data
      setTrayectos(Array.isArray(lista) ? lista : [])
      setOfrecidos(new Set((Array.isArray(ofertas) ? ofertas : []).map((o: UnidadCurricular) => o.trayectoId)))
    }).catch(() => {
      setTrayectos([])
      setOfrecidos(new Set())
      setError('No se pudo cargar la lista de trayectos.')
    }).finally(() => setLoadingDatos(false))
  }, [open, ucCatalogoId])

  // Trayecto.pnfId es la única relación real del modelo, así que se agrupa por PNF
  // para distinguir "Trayecto 1" repetido entre carreras distintas.
  const grupos = useMemo(() => {
    const porPnf = new Map<string, { nombre: string; trayectos: Trayecto[] }>()
    for (const t of trayectos) {
      const grupo = porPnf.get(t.pnfId) ?? { nombre: t.pnf?.nombre ?? 'PNF', trayectos: [] }
      grupo.trayectos.push(t)
      porPnf.set(t.pnfId, grupo)
    }
    return [...porPnf.entries()]
      .map(([pnfId, g]) => ({ pnfId, nombre: g.nombre, trayectos: g.trayectos.sort((a, b) => a.numero - b.numero) }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [trayectos])

  const toggle = (id: string, marcado: boolean) => {
    setSeleccion((prev) => {
      const siguiente = new Set(prev)
      if (marcado) siguiente.add(id)
      else siguiente.delete(id)
      return siguiente
    })
  }

  const toggleGrupo = (disponibles: Trayecto[], marcar: boolean) => {
    setSeleccion((prev) => {
      const siguiente = new Set(prev)
      for (const t of disponibles) {
        if (marcar) siguiente.add(t.id)
        else siguiente.delete(t.id)
      }
      return siguiente
    })
  }

  const etiquetaTrayecto = (id: string) => {
    const t = trayectos.find((x) => x.id === id)
    return t ? `${t.pnf?.nombre ?? 'PNF'} · ${t.nombre}` : id
  }

  const handleSubmit = async () => {
    if (!ucCatalogoId || seleccion.size === 0) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/unidades-curriculares/replicar', {
        ucCatalogoId,
        trayectoIds: [...seleccion],
      })
      const data: ReplicarUcResultado = res.data
      setResultado(data)
      if (data.creadas.length > 0) onDone()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo ofrecer la materia'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ofrecer en otros trayectos</DialogTitle>
          <DialogDescription>
            {resultado
              ? `Resultado para «${nombre}»`
              : `Marque los trayectos donde también se dictará «${nombre}». Se crea una oferta por trayecto con la misma materia del catálogo.`}
          </DialogDescription>
        </DialogHeader>

        {!ucCatalogoId ? (
          <FormError>Esta unidad curricular no está vinculada a una materia del catálogo.</FormError>
        ) : resultado ? (
          <div className="space-y-3">
            {resultado.creadas.length > 0 && (
              <p className="flex items-center gap-2 text-sm font-medium text-success">
                <CheckCircle2 className="h-4 w-4" />
                Se ofreció en {resultado.creadas.length} trayecto{resultado.creadas.length === 1 ? '' : 's'}.
              </p>
            )}
            {resultado.omitidos.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  {resultado.omitidos.length} no se pudo{resultado.omitidos.length === 1 ? '' : 'ieron'} crear:
                </p>
                <ul className="space-y-1.5 text-sm">
                  {resultado.omitidos.map((o) => (
                    <li key={o.trayectoId} className="rounded-md border border-border px-3 py-2">
                      <span className="font-medium text-foreground">{etiquetaTrayecto(o.trayectoId)}</span>
                      <span className="block text-muted-foreground">{o.motivo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : loadingDatos ? (
          <div className="py-8 text-center text-muted-foreground">Cargando trayectos...</div>
        ) : (
          <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {grupos.length === 0 && !error && (
              <p className="py-6 text-center text-sm text-muted-foreground">No hay trayectos disponibles.</p>
            )}
            {grupos.map((g) => {
              const disponibles = g.trayectos.filter((t) => !ofrecidos.has(t.id))
              const todosMarcados = disponibles.length > 0 && disponibles.every((t) => seleccion.has(t.id))
              return (
                <fieldset key={g.pnfId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <legend className="text-sm font-semibold text-foreground">{g.nombre}</legend>
                    {disponibles.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => toggleGrupo(disponibles, !todosMarcados)}
                      >
                        {todosMarcados ? 'Quitar todos' : 'Marcar todos'}
                      </Button>
                    )}
                  </div>
                  {g.trayectos.map((t) => {
                    const yaOfrecido = ofrecidos.has(t.id)
                    return (
                      <label
                        key={t.id}
                        htmlFor={`replicar-${t.id}`}
                        className={`flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm ${yaOfrecido ? 'bg-muted/70 text-muted-foreground' : 'cursor-pointer hover:bg-muted/70'}`}
                      >
                        <Checkbox
                          id={`replicar-${t.id}`}
                          checked={yaOfrecido || seleccion.has(t.id)}
                          disabled={yaOfrecido}
                          onCheckedChange={(v) => toggle(t.id, v === true)}
                        />
                        <span className="flex-1">{t.nombre}</span>
                        {yaOfrecido && <Badge variant="outline">Ya se ofrece</Badge>}
                      </label>
                    )
                  })}
                </fieldset>
              )
            })}
          </div>
        )}

        {error && <FormError>{error}</FormError>}

        <DialogFooter>
          {resultado ? (
            <Button type="button" onClick={() => onOpenChange(false)}>Cerrar</Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={loading || seleccion.size === 0 || !ucCatalogoId}>
                {loading
                  ? 'Ofreciendo...'
                  : seleccion.size === 0
                    ? 'Ofrecer'
                    : `Ofrecer en ${seleccion.size} trayecto${seleccion.size === 1 ? '' : 's'}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
