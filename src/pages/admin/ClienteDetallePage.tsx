import { useParams } from 'react-router-dom'
import { History } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { ClienteResumen } from '@/components/common/ClienteResumen'
import { CopyableId } from '@/components/common/CopyableId'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCliente } from '@/hooks/clientes'
import { ESTADO_CLIENTE_LABEL, ESTADO_CLIENTE_COLOR } from '@/lib/clienteConstants'
import { fmtDateTime } from '@/lib/dateFormat'

export default function ClienteDetallePage() {
  const { id } = useParams()
  const { data: cliente, isLoading } = useCliente(id)

  if (isLoading || !cliente) return <Skeleton className="h-96 rounded-xl" />

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${cliente.nombres} ${cliente.apellidos}`}
        description="Vista 360 — solo lectura."
        actions={
          <>
            <CopyableId id={cliente.id} />
            <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${ESTADO_CLIENTE_COLOR[cliente.estado]}`}>
              {ESTADO_CLIENTE_LABEL[cliente.estado]}
            </span>
          </>
        }
      />

      <ClienteResumen c={cliente} />

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
    </div>
  )
}
