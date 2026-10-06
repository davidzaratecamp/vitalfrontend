import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Headphones, Loader2, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGrabaciones, cargarAudioGrabacion, type OrigenGrabaciones } from '@/hooks/grabaciones'
import { apiErrorMessage } from '@/lib/api'
import { fmtDate } from '@/lib/dateFormat'

function fmtDuracion(seg: number) {
  const m = Math.floor(seg / 60)
  const s = seg % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Grabaciones de Aware del caso (supervisor/backoffice/admin) — llamadas
 * del agente dueño del caso a los teléfonos del cliente. El audio se pide
 * recién al darle "Escuchar" (cada uno pasa por una conversión en el
 * backend), y solo uno a la vez.
 */
export function GrabacionesCard({ origen }: { origen: OrigenGrabaciones }) {
  const { data, isLoading, error } = useGrabaciones(origen)
  const [activa, setActiva] = useState<{ id: string; url: string } | null>(null)
  const [cargandoId, setCargandoId] = useState<string | null>(null)

  useEffect(() => () => { if (activa) URL.revokeObjectURL(activa.url) }, [activa])

  async function escuchar(id: string) {
    setCargandoId(id)
    try {
      const url = await cargarAudioGrabacion(origen, id)
      setActiva({ id, url })
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo cargar la grabación'))
    } finally {
      setCargandoId(null)
    }
  }

  const llamadas = data?.llamadas ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Headphones className="size-4" /> Grabaciones de la llamada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : error ? (
          <p className="text-sm text-destructive">{apiErrorMessage(error, 'No se pudieron consultar las grabaciones')}</p>
        ) : !llamadas.length ? (
          <p className="text-sm text-muted-foreground">
            {data?.motivo ?? 'No se encontraron llamadas grabadas del agente a los teléfonos de este cliente.'}
          </p>
        ) : (
          llamadas.map((g) => (
            <div key={g.uniqueid} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="font-medium">{fmtDate(g.fecha)} {g.hora.slice(0, 5)}</span>
                  <span className="text-muted-foreground">
                    {' · '}{g.campana ?? `Proyecto ${g.proyecto_id}`}{' · '}{fmtDuracion(g.duracion)}{g.agente ? ` · ${g.agente}` : ''}
                  </span>
                  {!g.registrada && (
                    <span
                      className="ml-2 rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] text-amber-700 dark:text-amber-400"
                      title="Intento de llamada que Aware no dejó en su registro de gestión (solo queda en la central)"
                    >
                      No registrada en Aware
                    </span>
                  )}
                </div>
                {activa?.id === g.uniqueid ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setActiva(null)}>
                    <X className="size-4" /> Cerrar
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" disabled={cargandoId !== null} onClick={() => escuchar(g.uniqueid)}>
                    {cargandoId === g.uniqueid ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                    {cargandoId === g.uniqueid ? 'Cargando…' : 'Escuchar'}
                  </Button>
                )}
              </div>
              {activa?.id === g.uniqueid && (
                <audio className="mt-2 w-full" controls autoPlay src={activa.url} />
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
