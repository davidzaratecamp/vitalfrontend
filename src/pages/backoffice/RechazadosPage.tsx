import { Undo2 } from 'lucide-react'
import { ClientesEstadoTable } from '@/components/backoffice/ClientesEstadoTable'

export default function RechazadosPage() {
  return (
    <ClientesEstadoTable
      estado="rechazado_backoffice"
      title="Rechazados"
      description="Registros que devolviste al agente — esperando que los corrija y reenvíe."
      emptyIcon={Undo2}
      emptyTitle="No has rechazado ningún registro"
      emptyDescription="Los registros que devuelvas al agente para corrección aparecerán aquí."
      dateLabel="Rechazado"
      dateField="updated_at"
    />
  )
}
