import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { History, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { ClienteResumen } from '@/components/common/ClienteResumen'
import { CopyableId } from '@/components/common/CopyableId'
import { SoportePolizaCard } from '@/components/common/SoportePolizaCard'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCliente, useEliminarCliente } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'
import { ESTADO_CLIENTE_LABEL, ESTADO_CLIENTE_COLOR } from '@/lib/clienteConstants'
import { fmtDateTime } from '@/lib/dateFormat'

export default function ClienteDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: cliente, isLoading } = useCliente(id)
  const eliminar = useEliminarCliente()
  const [confirmBorrar, setConfirmBorrar] = useState(false)

  if (isLoading || !cliente) return <Skeleton className="h-96 rounded-xl" />

  async function onEliminar() {
    if (!id) return
    try {
      await eliminar.mutateAsync(id)
      toast.success('Borrador eliminado')
      navigate('/')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo eliminar'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${cliente.nombres} ${cliente.apellidos}`}
        description="Vista 360 — solo lectura."
        actions={
          <>
            {cliente.estado === 'borrador' && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmBorrar(true)}>
                <Trash2 className="size-4 text-destructive" /> Eliminar borrador
              </Button>
            )}
            <CopyableId id={cliente.id} />
            <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${ESTADO_CLIENTE_COLOR[cliente.estado]}`}>
              {ESTADO_CLIENTE_LABEL[cliente.estado]}
            </span>
          </>
        }
      />

      <ClienteResumen c={cliente} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SoportePolizaCard clienteId={cliente.id} editable={false} />
        <SoportePolizaCard clienteId={cliente.id} editable={false} tipo="rechazo" titulo="Soporte del rechazo" />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="size-4" /> Historial de estados</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {cliente.historial.map((h) => (
            <div key={h.id} className="flex justify-between text-sm">
              <span>
                {h.estado_anterior ? `${ESTADO_CLIENTE_LABEL[h.estado_anterior]} → ` : ''}
                <span className="font-medium">{ESTADO_CLIENTE_LABEL[h.estado_nuevo]}</span>
                {h.motivo && <span className="text-muted-foreground"> · {h.motivo}</span>}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {h.cambiado_por_nombre} · {fmtDateTime(h.created_at)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmBorrar}
        onOpenChange={setConfirmBorrar}
        title="¿Eliminar este borrador?"
        description="Se va a borrar por completo, con todo lo que se haya guardado (dependientes, evidencias, etc). No se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        loading={eliminar.isPending}
        onConfirm={onEliminar}
      />
    </div>
  )
}
