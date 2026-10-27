import { useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw, CalendarClock, PlayCircle } from 'lucide-react'
import { RenovacionesTable } from '@/components/renovaciones/RenovacionesTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTemporadaRenovacion, useAbrirTemporada } from '@/hooks/renovaciones'
import { useAuthStore } from '@/stores/auth'
import { ESTADO_CLIENTE_LABEL, ESTADOS_RENOVACION } from '@/lib/clienteConstants'
import { apiErrorMessage } from '@/lib/api'

/**
 * Vista de admin y supervisor: todas las renovaciones de todos los agentes,
 * en cualquier estado, más la tarjeta de estado de la temporada.
 *
 * Solo admin ve el botón "Abrir temporada ahora". No hace falta para que la
 * temporada funcione —el servidor la chequea solo cada 6 horas y la abre el
 * 1 de noviembre— es la red de seguridad por si el servidor estuvo caído
 * ese día, o para verificar el resultado sin esperar al próximo chequeo.
 */
function TarjetaTemporada() {
  const role = useAuthStore((st) => st.user?.role)
  const { data, isLoading } = useTemporadaRenovacion()
  const abrir = useAbrirTemporada()
  const [confirmar, setConfirmar] = useState(false)

  if (isLoading) return <Skeleton className="h-28 rounded-xl" />
  if (!data) return null

  const enCurso = ESTADOS_RENOVACION.map((e) => [e, data.por_estado[e] ?? 0] as const).filter(([, n]) => n > 0)

  async function onAbrir() {
    try {
      const r = await abrir.mutateAsync({})
      toast.success(
        r.movidas
          ? `Temporada ${r.temporada}: ${r.movidas} póliza${r.movidas === 1 ? '' : 's'} pasaron a "Pendiente renovación".`
          : `No había nada por mover — la temporada ${r.temporada} ya está al día.`
      )
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo abrir la temporada'))
    } finally {
      setConfirmar(false)
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">Temporada {data.temporada}</p>
          <span className="text-xs text-muted-foreground">abrió el {data.abre}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {data.por_entrar > 0 ? (
            <>
              <span className="font-medium text-foreground">{data.por_entrar}</span> póliza
              {data.por_entrar === 1 ? '' : 's'} vigente{data.por_entrar === 1 ? '' : 's'} esperando entrar a la temporada.
            </>
          ) : (
            'Todas las pólizas que corresponde ya entraron a la temporada.'
          )}
        </p>
        {!!enCurso.length && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {enCurso.map(([estado, n]) => (
              <span key={estado}>
                {ESTADO_CLIENTE_LABEL[estado] ?? estado}: <span className="font-medium text-foreground">{n}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {role === 'admin' && (
        <Button variant="outline" className="shrink-0" onClick={() => setConfirmar(true)} disabled={abrir.isPending}>
          <PlayCircle className="size-4" />
          {abrir.isPending ? 'Abriendo...' : 'Abrir temporada ahora'}
        </Button>
      )}

      <ConfirmDialog
        open={confirmar}
        onOpenChange={setConfirmar}
        title="¿Abrir la temporada de renovaciones?"
        description={
          data.por_entrar > 0
            ? `${data.por_entrar} póliza(s) vigentes pasarán a "Pendiente renovación" y sus agentes recibirán el aviso. El sistema ya hace esto solo cada 1 de noviembre; esto es para adelantarlo o reintentarlo. Apretarlo dos veces no mueve nada dos veces.`
            : 'Ahora mismo no hay ninguna póliza por mover, así que no va a pasar nada. Puedes confirmar igual para verificarlo.'
        }
        confirmLabel="Abrir temporada"
        onConfirm={onAbrir}
      />
    </Card>
  )
}

export default function PanelRenovacionesPage() {
  return (
    <div className="space-y-6">
      <TarjetaTemporada />
      <RenovacionesTable
        estados={ESTADOS_RENOVACION}
        title="Renovaciones"
        description="Todas las pólizas en temporada de renovación, en cualquier estado y de todos los agentes."
        emptyIcon={RefreshCw}
        emptyTitle="No hay renovaciones todavía"
        emptyDescription="Cada 1 de noviembre las pólizas vigentes pasan solas a renovación."
        rutaDetalle={(id) => `/clientes/${id}`}
      />
    </div>
  )
}
