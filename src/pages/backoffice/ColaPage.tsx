import { ListChecks } from 'lucide-react'
import { ClientesEstadoTable } from '@/components/backoffice/ClientesEstadoTable'

export default function ColaPage() {
  return (
    <ClientesEstadoTable
      estado="pendiente_backoffice"
      title="Cola de pendientes"
      description="Registros que enviaron los agentes, esperando revisión."
      emptyIcon={ListChecks}
      emptyTitle="No hay nada pendiente"
      emptyDescription="Cuando un agente finalice un registro, aparecerá aquí."
      dateLabel="Enviado"
      dateField="submitted_at"
      mostrarAntiguedad
    />
  )
}
