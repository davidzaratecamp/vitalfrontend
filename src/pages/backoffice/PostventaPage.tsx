import { ListChecks } from 'lucide-react'
import { CasosPostventaTable } from '@/components/casosPostventa/CasosPostventaTable'

/** Cola de postventa de BackOffice — el backend ya la fuerza a
 * estado IN (escalado_backoffice, seguimiento_backoffice-propios) + la
 * empresa del usuario (ver listarCasos en casosPostventa.service.js), por
 * eso no hay selector de estado acá. 'seguimiento_backoffice' son SOLO los
 * que este mismo backoffice tomó (exclusividad, 2026-09-29) — el backend ya
 * filtra por gestionado_por, acá no hace falta nada extra. Sí respeta
 * búsqueda, tipo de caso, tipo de gestión y rango de fechas. */
export default function PostventaPage() {
  return (
    <CasosPostventaTable
      estadosBase={['escalado_backoffice', 'seguimiento_backoffice']}
      title="Postventa"
      description="Casos que un agente escaló a BackOffice."
      emptyIcon={ListChecks}
      emptyTitle="No hay casos escalados"
      emptyDescription="Cuando un agente escale un caso, aparecerá aquí."
      detailBasePath="/casos"
    />
  )
}
