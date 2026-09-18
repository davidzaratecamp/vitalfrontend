import { FileSignature, RefreshCw, Download, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFirmas, useEnviarFirma, useActualizarEstadoFirma, abrirCartaFirmada } from '@/hooks/firmas'
import { apiErrorMessage } from '@/lib/api'
import { fmtDateTime } from '@/lib/dateFormat'
import { ESTADO_FIRMA_LABEL, ESTADO_FIRMA_COLOR } from '@/lib/clienteConstants'
import { useAuthStore } from '@/stores/auth'

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSignature className="size-4" /> Carta de firma (CMS)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : ultima ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado</span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${ESTADO_FIRMA_COLOR[ultima.estado]}`}>
                {ESTADO_FIRMA_LABEL[ultima.estado] ?? ultima.estado}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Enviada</span>
              <span>{fmtDateTime(ultima.enviado_at)} · {ultima.enviado_por_nombre}</span>
            </div>
            {ultima.visto_at && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Vista</span>
                <span>{fmtDateTime(ultima.visto_at)}</span>
              </div>
            )}
            {ultima.firmado_at && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Firmada</span>
                <span>{fmtDateTime(ultima.firmado_at)} · {ultima.firmante_nombre}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavía no se ha enviado la carta{!correoCliente && ' — hace falta un correo del cliente'}.
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
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
