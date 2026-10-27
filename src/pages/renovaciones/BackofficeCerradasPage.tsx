import { CheckCircle2 } from 'lucide-react'
import { RenovacionesTable } from '@/components/renovaciones/RenovacionesTable'

/** Historial de BackOffice: lo que ya cerró, renovado o rechazado. */
export default function BackofficeCerradasPage() {
  return (
    <RenovacionesTable
      estados={['renovado', 'rechazado_backoffice_renovacion']}
      title="Renovadas y rechazadas"
      description="Historial de lo que ya cerraste: pólizas renovadas y renovaciones devueltas al agente."
      emptyIcon={CheckCircle2}
      emptyTitle="Todavía no has cerrado ninguna renovación"
      emptyDescription="Lo que renueves o rechaces quedará listado aquí."
      rutaDetalle={(id) => `/clientes/${id}`}
    />
  )
}
