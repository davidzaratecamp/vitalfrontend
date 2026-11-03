import { CheckCircle2 } from 'lucide-react'
import { ClientesEstadoTable } from '@/components/backoffice/ClientesEstadoTable'

export default function CompletadosPage() {
  return (
    <ClientesEstadoTable
      estado="aprobado"
      title="Completados"
      description="Ventas que BackOffice aprobó, aunque hoy estén en renovación — con su fecha de aprobación y el estado en que están ahora."
      emptyIcon={CheckCircle2}
      emptyTitle="Todavía no has aprobado ninguna venta"
      emptyDescription="Cuando completes una gestión desde la cola de pendientes, aparecerá aquí."
      dateLabel="Aprobado"
      dateField="aprobado_at"
      mostrarEstado
    />
  )
}
