import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Undo2, Paperclip } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRechazados } from '@/hooks/agente'
import { useSoportesPoliza, abrirSoportePoliza } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'
import type { ClienteRechazado } from '@/lib/types'

function RechazadoCard({ c, onCorregir }: { c: ClienteRechazado; onCorregir: () => void }) {
  const { data: soportes } = useSoportesPoliza(c.id)
  const soporteRechazo = soportes?.filter((s) => s.tipo === 'rechazo')
  const [viendoId, setViendoId] = useState<number | null>(null)

  async function ver(id: number, nombreArchivo: string) {
    setViendoId(id)
    try {
      await abrirSoportePoliza(id, nombreArchivo)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo abrir el archivo'))
    } finally {
      setViendoId(null)
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium">{c.nombres} {c.apellidos}</p>
        <p className="text-sm text-muted-foreground">{c.correo_electronico} · {c.phone_1}</p>
        {c.rechazo_motivo && (
          <div className="mt-1.5 flex items-start gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
            <p className="min-w-0 flex-1">Motivo: {c.rechazo_motivo}</p>
            {/* El ícono va AL LADO del motivo, nunca encima — el texto del
                motivo es lo más importante acá y no se puede tapar. */}
            {!!soporteRechazo?.length && (
              <div className="flex shrink-0 items-center gap-1">
                {soporteRechazo.map((s) => (
                  <Button
                    key={s.id}
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 text-destructive hover:text-destructive"
                    title="Ver soporte del rechazo (imagen adjuntada por BackOffice)"
                    disabled={viendoId === s.id}
                    onClick={() => ver(s.id, s.nombre_archivo)}
                  >
                    <Paperclip className="size-3.5" />
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Button onClick={onCorregir}>Corregir y reenviar</Button>
    </Card>
  )
}

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
            <RechazadoCard key={c.id} c={c} onCorregir={() => navigate(`/clientes/${c.id}/editar`)} />
          ))}
        </div>
      )}
    </div>
  )
}
