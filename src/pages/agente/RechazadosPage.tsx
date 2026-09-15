import { useNavigate } from 'react-router-dom'
import { Undo2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRechazados } from '@/hooks/agente'

export default function RechazadosPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useRechazados()

  return (
    <div className="space-y-6">
      <PageHeader title="Rechazados por BackOffice" description="Corrige lo que pida el motivo y reenvía desde el mismo formulario." />

      {isLoading ? (
        <Skeleton className="h-56 rounded-xl" />
      ) : !data?.length ? (
        <EmptyState icon={Undo2} title="No tienes ventas rechazadas" description="Cuando BackOffice rechace un registro tuyo, aparecerá aquí." />
      ) : (
        <div className="space-y-3">
          {data.map((c) => (
            <Card key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{c.nombres} {c.apellidos}</p>
                <p className="text-sm text-muted-foreground">{c.correo_electronico} · {c.phone_1}</p>
                {c.rechazo_motivo && (
                  <p className="mt-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
                    Motivo: {c.rechazo_motivo}
                  </p>
                )}
              </div>
              <Button onClick={() => navigate(`/clientes/${c.id}/editar`)}>Corregir y reenviar</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
