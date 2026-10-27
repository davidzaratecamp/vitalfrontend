import { CheckCheck } from 'lucide-react'
import { RenovacionesTable } from '@/components/renovaciones/RenovacionesTable'

/** Lo que el agente ya mandó: en manos de BackOffice o ya cerrado. */
export default function AgenteEnviadasPage() {
  return (
    <RenovacionesTable
      estados={['pendiente_backoffice_renovacion', 'pendiente_autorizacion_renovacion', 'renovado']}
      title="Enviadas y renovadas"
      description="Renovaciones que ya mandaste a BackOffice, incluidas las que están esperando autorización y las que ya quedaron renovadas."
      emptyIcon={CheckCheck}
      emptyTitle="Todavía no has enviado ninguna renovación"
      emptyDescription="Las que envíes a BackOffice aparecerán aquí hasta que queden renovadas."
      rutaDetalle={(id) => `/renovaciones/${id}`}
    />
  )
}
