import type { ComponentType } from 'react'
import { FileSignature, RefreshCw, Download, Send, Eye, CircleCheckBig, Clock, CircleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFirmas, useEnviarFirma, useActualizarEstadoFirma, abrirCartaFirmada } from '@/hooks/firmas'
import { apiErrorMessage } from '@/lib/api'
import { fmtDateTime } from '@/lib/dateFormat'
import { cn } from '@/lib/utils'
import { ESTADO_FIRMA_LABEL, ESTADO_FIRMA_COLOR } from '@/lib/clienteConstants'
import { useAuthStore } from '@/stores/auth'
import type { FirmaDocumento } from '@/lib/types'

function NodoPaso({ icon: Icon, label, meta, alcanzado }: { icon: ComponentType<{ className?: string }>; label: string; meta: string | null; alcanzado: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div
        className={cn(
          'flex size-9 items-center justify-center rounded-full border-2 transition-colors',
          alcanzado ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted text-muted-foreground'
        )}
      >
        <Icon className="size-4" />
      </div>
      <div>
        <p className={cn('text-xs font-medium', alcanzado ? 'text-foreground' : 'text-muted-foreground')}>{label}</p>
        <p className="text-[11px] text-muted-foreground">{meta ?? '—'}</p>
      </div>
    </div>
  )
}

function Conector({ activo }: { activo: boolean }) {
  return <div className={cn('mt-[18px] h-0.5 flex-1', activo ? 'bg-primary' : 'bg-border')} />
}

/** Enviada → Vista → Firmada. Expirada/fallida no son un cuarto paso de la
 * misma línea — son una salida distinta del camino feliz, se muestran
 * aparte como alerta (ver esTerminal en el componente principal). */
function TrackerFirma({ f }: { f: FirmaDocumento }) {
  const vistaAlcanzada = !!f.visto_at || f.estado === 'signed'
  const firmadaAlcanzada = f.estado === 'signed'
  return (
    <div className="flex items-start">
      <NodoPaso
        icon={Send}
        label="Enviada"
        alcanzado
        meta={`${fmtDateTime(f.enviado_at)}${f.enviado_por_nombre ? ` · ${f.enviado_por_nombre}` : ''}`}
      />
      <Conector activo={vistaAlcanzada} />
      <NodoPaso icon={Eye} label="Vista" alcanzado={vistaAlcanzada} meta={f.visto_at ? fmtDateTime(f.visto_at) : null} />
      <Conector activo={firmadaAlcanzada} />
      <NodoPaso
        icon={CircleCheckBig}
        label="Firmada"
        alcanzado={firmadaAlcanzada}
        meta={f.firmado_at ? `${fmtDateTime(f.firmado_at)}${f.firmante_nombre ? ` · ${f.firmante_nombre}` : ''}` : null}
      />
    </div>
  )
}

/**
 * Envío y seguimiento de la Carta CMS Vital (FirmaCloud). No depende de que
 * los demás pasos estén completos — se puede enviar apenas el cliente tenga
 * correo, aunque falte llenar el resto del formulario.
 */
export function FirmaCartaCard({ clienteId, correoCliente }: { clienteId: number; correoCliente?: string | null }) {
  // El supervisor es solo-lectura: ve el estado de la carta, no la envía
  // ni la reenvía (el backend también lo bloquea, esto es solo para no
  // mostrar un botón que igual va a fallar).
  const soloLectura = useAuthStore((s) => s.user?.role) === 'supervisor'
  const { data: firmas, isLoading } = useFirmas(clienteId)
  const enviar = useEnviarFirma(clienteId)
  const actualizar = useActualizarEstadoFirma(clienteId)
  const ultima = firmas?.[0]

  async function onEnviar() {
    try {
      await enviar.mutateAsync()
      toast.success('Carta enviada por correo')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo enviar la carta'))
    }
  }

  async function onActualizar() {
    try {
      await actualizar.mutateAsync()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo consultar el estado'))
    }
  }

  async function onDescargar() {
    try {
      await abrirCartaFirmada(clienteId)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo abrir el documento firmado'))
    }
  }

  const puedeEnviar = !!correoCliente && !soloLectura
  const esTerminal = ultima?.estado === 'expired' || ultima?.estado === 'failed'

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSignature className="size-4" /> Carta de firma (CMS)
        </CardTitle>
        {ultima && (
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', ESTADO_FIRMA_COLOR[ultima.estado])}>
            <span className="size-1.5 rounded-full bg-current" />
            {ESTADO_FIRMA_LABEL[ultima.estado] ?? ultima.estado}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : ultima ? (
          <>
            <TrackerFirma f={ultima} />
            {esTerminal && (
              <div
                className={cn(
                  'flex gap-2.5 rounded-lg border p-3 text-sm',
                  ultima.estado === 'expired' ? 'border-amber-500/40 bg-amber-500/5' : 'border-destructive/40 bg-destructive/5'
                )}
              >
                {ultima.estado === 'expired' ? (
                  <Clock className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                ) : (
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                )}
                <p className="text-muted-foreground">
                  {ultima.estado === 'expired'
                    ? 'El enlace venció a las 72 horas sin que el cliente firmara.'
                    : 'FirmaCloud reportó un error con este envío.'}{' '}
                  {!soloLectura && 'Usa "Reenviar carta" para mandar un enlace nuevo.'}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavía no se ha enviado la carta{!correoCliente && ' — hace falta un correo del cliente'}.
          </p>
        )}

        <div className="flex flex-wrap gap-2 border-t pt-3">
          {!soloLectura && (
            <Button type="button" size="sm" onClick={onEnviar} disabled={!puedeEnviar || enviar.isPending}>
              <Send className="size-3.5" />
              {enviar.isPending ? 'Enviando...' : ultima ? 'Reenviar carta' : 'Enviar carta'}
            </Button>
          )}
          {!soloLectura && ultima?.firmacloud_id && ultima.estado !== 'signed' && (
            <Button type="button" size="sm" variant="outline" onClick={onActualizar} disabled={actualizar.isPending}>
              <RefreshCw className="size-3.5" /> Actualizar estado
            </Button>
          )}
          {ultima?.estado === 'signed' && (
            <Button type="button" size="sm" variant="outline" onClick={onDescargar}>
              <Download className="size-3.5" /> Ver PDF firmado
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
