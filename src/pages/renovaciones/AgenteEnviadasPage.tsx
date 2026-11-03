import { CheckCheck } from 'lucide-react'
import { RenovacionesTable } from '@/components/renovaciones/RenovacionesTable'

/** Lo que el agente ya mandó o cerró: en manos de BackOffice, renovado o
 * no renovado (2026-11-03). */
export default function AgenteEnviadasPage() {
  return (
    <RenovacionesTable
      estados={['pendiente_backoffice_renovacion', 'pendiente_autorizacion_renovacion', 'renovado', 'no_renovado']}
      title="Enviadas y cerradas"
      description="Renovaciones que ya mandaste a BackOffice (en revisión, esperando autorización o renovadas) y las que cerraste como no renovadas."
      emptyIcon={CheckCheck}
      emptyTitle="Todavía no has enviado ninguna renovación"
      emptyDescription="Las que envíes a BackOffice aparecerán aquí hasta que queden renovadas."
      rutaDetalle={(id) => `/renovaciones/${id}`}
    />
  )
}
