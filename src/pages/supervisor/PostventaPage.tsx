import { Headphones } from 'lucide-react'
import { CasosPostventaTable } from '@/components/casosPostventa/CasosPostventaTable'

/** Vista consolidada de postventa para supervisor — igual que la de admin
 * (2026-09-29, pedido del usuario: el supervisor tiene que poder ver el
 * estado de seguimiento de BackOffice y quién tomó cada caso, igual que
 * admin). Sin restricción de estado, acotada a la empresa del supervisor
 * (a diferencia de admin, que ve las dos) — ver listarCasos en
 * casosPostventa.service.js. */
export default function PostventaPage() {
  return (
    <CasosPostventaTable
      estadosBase={['nuevo', 'seguimiento', 'cerrado', 'escalado_backoffice', 'seguimiento_backoffice']}
      estadoOpciones={[
        { value: 'nuevo', label: 'Nuevo' },
        { value: 'seguimiento', label: 'Seguimiento' },
        { value: 'cerrado', label: 'Cerrado' },
        { value: 'escalado_backoffice', label: 'Escalado a BackOffice' },
        { value: 'seguimiento_backoffice', label: 'En seguimiento (BackOffice)' },
      ]}
      mostrarRolGestion
      title="Postventa"
      description="Todos los casos de postventa de tu empresa, gestionados por Agente o por BackOffice."
      emptyIcon={Headphones}
      emptyTitle="Todavía no hay casos de postventa"
      emptyDescription="Cuando un agente valide un cliente y abra un caso, aparecerá aquí."
    />
  )
}
