import { PhoneCall } from 'lucide-react'
import { ClientesEstadoTable } from '@/components/backoffice/ClientesEstadoTable'

export default function PendienteTripartitaPage() {
  return (
    <ClientesEstadoTable
      estado="pendiente_llamada_tripartita"
      title="Pendiente llamada tripartita"
      description="Casos que ya gestionaste, esperando coordinar una llamada de 3 (cliente + agente + BackOffice) antes de aprobar o rechazar."
      emptyIcon={PhoneCall}
      emptyTitle="No hay casos esperando llamada tripartita"
      emptyDescription="Cuando marques un caso como pendiente de llamada tripartita desde la cola, aparecerá aquí."
      dateLabel="Marcado"
      dateField="updated_at"
    />
  )
}
