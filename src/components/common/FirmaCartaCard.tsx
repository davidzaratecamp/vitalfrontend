import { useState, type ComponentType } from 'react'
import { FileSignature, RefreshCw, Download, Send, Eye, CircleCheckBig, Clock, CircleAlert, Mail, MessageSquare } from 'lucide-react'
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
        meta={`${fmtDateTime(f.enviado_at)}${f.enviado_por_nombre ? ` · ${f.enviado_por_nombre}` : ''} · ${f.canal === 'sms' ? 'SMS' : 'Correo'}`}
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

// EE. UU. — 10 dígitos limpios, o 11 empezando en 1 (con el código de país
// ya incluido). Nada más se acepta para SMS, es lo único que soporta
// FirmaCloud por este canal.
function esTelefonoUS(telefono?: string | null) {
  const digitos = (telefono ?? '').replace(/\D/g, '')
  return digitos.length === 10 || (digitos.length === 11 && digitos.startsWith('1'))
}

/**
 * Envío y seguimiento de la Carta CMS Vital (FirmaCloud). No depende de que
 * los demás pasos estén completos — se puede enviar apenas el cliente tenga
 * correo o teléfono, aunque falte llenar el resto del formulario.
 */
export function FirmaCartaCard({
  clienteId,
  correoCliente,
  telefonoCliente,
}: {
  clienteId: number
  correoCliente?: string | null
  telefonoCliente?: string | null
}) {
  const role = useAuthStore((s) => s.user?.role)
  // El supervisor es solo-lectura total. BackOffice sí puede refrescar el
  // estado y ver el PDF firmado, pero no le corresponde enviarle nada al
  // cliente — eso es del agente (dueño del caso) o admin (el backend
  // también lo bloquea, esto es solo para no mostrar un botón que igual
  // va a fallar).
  const soloLectura = role === 'supervisor'
  const puedeEnviarCarta = role === 'agente' || role === 'admin'
  const { data: firmas, isLoading } = useFirmas(clienteId)
  const enviar = useEnviarFirma(clienteId)
  const actualizar = useActualizarEstadoFirma(clienteId)
  const ultima = firmas?.[0]
  const [canal, setCanal] = useState<'email' | 'sms'>('email')

  const telefonoValido = esTelefonoUS(telefonoCliente)
  const puedeEnviarPorCanal = canal === 'email' ? !!correoCliente : telefonoValido

  async function onEnviar() {
    try {
      await enviar.mutateAsync(canal)
      toast.success(`Carta enviada por ${canal === 'sms' ? 'SMS' : 'correo'}`)
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

  const puedeEnviar = puedeEnviarPorCanal && puedeEnviarCarta
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
                  {puedeEnviarCarta && 'Usa "Reenviar carta" para mandar un enlace nuevo.'}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no se ha enviado la carta.</p>
        )}

        {puedeEnviarCarta && (
          <div className="flex flex-wrap items-center gap-3 border-t pt-3">
            <span className="text-xs text-muted-foreground">Enviar por:</span>
            <div className="inline-flex rounded-md border p-0.5">
              <button
                type="button"
                onClick={() => setCanal('email')}
                className={cn(
                  'flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors',
                  canal === 'email' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Mail className="size-3.5" /> Correo
              </button>
              <button
                type="button"
                onClick={() => setCanal('sms')}
                className={cn(
                  'flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors',
                  canal === 'sms' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <MessageSquare className="size-3.5" /> SMS
              </button>
            </div>
            {!puedeEnviarPorCanal && (
              <span className="text-xs text-muted-foreground">
                {canal === 'email' ? 'Falta el correo del cliente.' : 'El teléfono debe ser un número de EE. UU. válido (10 dígitos).'}
              </span>
            )}
          </div>
        )}

        <div className={cn('flex flex-wrap gap-2', !puedeEnviarCarta && 'border-t pt-3')}>
          {puedeEnviarCarta && (
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
