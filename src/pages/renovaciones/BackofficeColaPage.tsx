import { ListChecks } from 'lucide-react'
import { RenovacionesTable } from '@/components/renovaciones/RenovacionesTable'

/** Cola de renovaciones de BackOffice. Se gestionan en la MISMA pantalla
 * que una venta (/clientes/:id) — mismos botones de aprobar, rechazar y
 * parada intermedia, solo cambia el estado destino. */
export default function BackofficeColaPage() {
  return (
    <RenovacionesTable
      estados={['pendiente_backoffice_renovacion']}
      title="Cola de renovaciones"
      description="Renovaciones que enviaron los agentes, esperando revisión."
      emptyIcon={ListChecks}
      emptyTitle="No hay renovaciones pendientes"
      emptyDescription="Cuando un agente envíe una renovación, aparecerá aquí."
      rutaDetalle={(id) => `/clientes/${id}`}
      mostrarEstado={false}
    />
  )
}
