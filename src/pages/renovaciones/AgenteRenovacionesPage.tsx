import { RefreshCw } from 'lucide-react'
import { RenovacionesTable } from '@/components/renovaciones/RenovacionesTable'

/** Lo que al agente le toca renovar ahora. */
export default function AgenteRenovacionesPage() {
  return (
    <RenovacionesTable
      estados={['pendiente_renovacion']}
      title="Por renovar"
      description="Pólizas tuyas que entraron a la temporada. Abre cada una, revisa y corrige lo que haga falta, suma los documentos nuevos y envíala a BackOffice."
      emptyIcon={RefreshCw}
      emptyTitle="No tienes pólizas por renovar"
      emptyDescription="Cada 1 de noviembre tus ventas aprobadas pasan solas a esta lista."
      rutaDetalle={(id) => `/renovaciones/${id}`}
      mostrarEstado={false}
    />
  )
}
