import { CheckCircle2 } from 'lucide-react'
import { ClientesEstadoTable } from '@/components/backoffice/ClientesEstadoTable'

export default function CompletadosPage() {
  return (
    <ClientesEstadoTable
      estado="aprobado"
      title="Completados"
      description="Ventas que ya aprobaste — quedan cerradas y listas para el reporte del admin."
      emptyIcon={CheckCircle2}
      emptyTitle="Todavía no has aprobado ninguna venta"
      emptyDescription="Cuando completes una gestión desde la cola de pendientes, aparecerá aquí."
      dateLabel="Aprobado"
      dateField="updated_at"
    />
  )
}
