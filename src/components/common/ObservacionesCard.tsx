import { useState } from 'react'
import { toast } from 'sonner'
import { MessageSquarePlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAgregarObservacionCliente } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'
import { fmtDateTime } from '@/lib/dateFormat'
import { useAuthStore } from '@/stores/auth'
import type { Observacion } from '@/lib/types'

/**
 * Bitácora de notas internas del caso — visible para agente, BackOffice y
 * admin (todos comparten la misma lista, `cliente.observaciones`, ya
 * incluida en cada respuesta de GET /clientes/:id). Antes solo existía
 * dentro de la pantalla de gestión de BackOffice, así que nadie más veía
 * lo que el back dejaba anotado sobre un caso (2026-09-22).
 * Supervisor es de solo lectura — el backend también lo bloquea si intenta
 * escribir (POST /clientes/:id/observaciones).
 */
export function ObservacionesCard({ clienteId, observaciones }: { clienteId: number; observaciones: Observacion[] }) {
  const role = useAuthStore((s) => s.user?.role)
  const agregar = useAgregarObservacionCliente(clienteId)
  const [comentario, setComentario] = useState('')
  const puedeEscribir = role !== 'supervisor'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!comentario.trim()) return
    try {
      await agregar.mutateAsync(comentario)
      setComentario('')
      toast.success('Nota agregada')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquarePlus className="size-4" /> Observaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {puedeEscribir && (
          <form onSubmit={onSubmit} noValidate className="flex gap-2">
            <Input value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Escribe una nota visible para agente/BackOffice/Admin..." />
            <Button type="submit" disabled={agregar.isPending}>Agregar</Button>
          </form>
        )}
        {observaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin observaciones.</p>
        ) : (
          <div className="space-y-2 border-t pt-3">
            {observaciones.map((o) => (
              <p key={o.id} className="text-sm">
                <span className="font-medium">{o.autor_nombre}</span>{' '}
                <span className="text-xs text-muted-foreground">{fmtDateTime(o.created_at)}</span>
                <br />{o.comentario}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
