import { Headphones } from 'lucide-react'
import { CasosPostventaTable } from '@/components/casosPostventa/CasosPostventaTable'

/** Vista consolidada de postventa para admin — sin restricción de estado ni
 * de empresa (a diferencia de la cola de BackOffice), con filtro de
 * "gestionado por Agente/BackOffice" para distinguir de un vistazo quién
 * llevó cada caso (2026-09-24, pedido del usuario). */
export default function PostventaPage() {
  return (
    <CasosPostventaTable
      estadosBase={['nuevo', 'seguimiento', 'cerrado', 'escalado_backoffice']}
      estadoOpciones={[
        { value: 'nuevo', label: 'Nuevo' },
        { value: 'seguimiento', label: 'Seguimiento' },
        { value: 'cerrado', label: 'Cerrado' },
        { value: 'escalado_backoffice', label: 'Escalado a BackOffice' },
      ]}
      mostrarRolGestion
      title="Postventa"
      description="Todos los casos de postventa, gestionados por Agente o por BackOffice."
      emptyIcon={Headphones}
      emptyTitle="Todavía no hay casos de postventa"
      emptyDescription="Cuando un agente valide un cliente y abra un caso, aparecerá aquí."
    />
  )
}
