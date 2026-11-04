import { PhoneCall } from 'lucide-react'
import { ClientesEstadoTable } from '@/components/backoffice/ClientesEstadoTable'

export default function PendienteTripartitaPage() {
  return (
    <ClientesEstadoTable
      estado="pendiente_llamada_tripartita"
      title="Pendiente autorización cliente"
      description="Casos que ya gestionaste, esperando la autorización del cliente antes de aprobar o rechazar."
      emptyIcon={PhoneCall}
      emptyTitle="No hay casos esperando autorización del cliente"
      emptyDescription="Cuando marques un caso como pendiente de autorización del cliente desde la cola, aparecerá aquí."
      dateLabel="Marcado"
      dateField="updated_at"
    />
  )
}
