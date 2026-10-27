import { PhoneCall } from 'lucide-react'
import { RenovacionesTable } from '@/components/renovaciones/RenovacionesTable'

/** El equivalente de "Pendiente llamada tripartita" en renovaciones:
 * BackOffice ya la gestionó pero le falta una autorización para cerrarla. */
export default function BackofficeAutorizacionPage() {
  return (
    <RenovacionesTable
      estados={['pendiente_autorizacion_renovacion']}
      title="Pendiente autorización renovación"
      description="Renovaciones que ya revisaste pero que esperan una autorización antes de poder renovarse o rechazarse."
      emptyIcon={PhoneCall}
      emptyTitle="Nada esperando autorización"
      emptyDescription="Cuando marques una renovación como pendiente de autorización, aparecerá aquí."
      rutaDetalle={(id) => `/clientes/${id}`}
      mostrarEstado={false}
    />
  )
}
