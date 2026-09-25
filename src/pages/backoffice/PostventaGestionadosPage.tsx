import { CheckCheck } from 'lucide-react'
import { CasosPostventaTable } from '@/components/casosPostventa/CasosPostventaTable'

/** Casos de postventa que BackOffice ya cerró (2026-09-25, pedido del
 * usuario: "que el backoffice en postventa no solo tenga los sin
 * gestionar sino también los gestionados") — el backend filtra a
 * estado='cerrado' Y gestionado por alguien de BackOffice, para no
 * mezclar con casos que un agente cerró directo sin escalar. */
export default function PostventaGestionadosPage() {
  return (
    <CasosPostventaTable
      estadosBase={['cerrado']}
      title="Postventa gestionados"
      description="Casos de postventa que ya cerraste."
      emptyIcon={CheckCheck}
      emptyTitle="Todavía no has cerrado ningún caso de postventa"
      emptyDescription="Los casos escalados que cierres aparecerán aquí."
      detailBasePath="/casos"
    />
  )
}
