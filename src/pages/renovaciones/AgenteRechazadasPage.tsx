import { Undo2 } from 'lucide-react'
import { RenovacionesTable } from '@/components/renovaciones/RenovacionesTable'

/** Renovaciones que BackOffice devolvió — mismo camino de corrección que
 * una venta rechazada: se abre el mismo formulario y se reenvía. */
export default function AgenteRechazadasPage() {
  return (
    <RenovacionesTable
      estados={['rechazado_backoffice_renovacion']}
      title="Rechazadas por BackOffice"
      description="Corrige lo que pida el motivo y reenvía la renovación desde el mismo formulario."
      emptyIcon={Undo2}
      emptyTitle="No tienes renovaciones rechazadas"
      emptyDescription="Cuando BackOffice devuelva una renovación tuya, aparecerá aquí."
      rutaDetalle={(id) => `/renovaciones/${id}`}
      mostrarEstado={false}
    />
  )
}
