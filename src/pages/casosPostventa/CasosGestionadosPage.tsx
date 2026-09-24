import { CheckCircle2 } from 'lucide-react'
import { CasosPostventaTable } from '@/components/casosPostventa/CasosPostventaTable'

export default function CasosGestionadosPage() {
  return (
    <CasosPostventaTable
      estadosBase={['cerrado', 'escalado_backoffice']}
      // Junta cerrados y escalados por defecto — este filtro deja ver solo
      // los que se pasaron a BackOffice, con su ID, sin mezclarlos con los
      // que ya se cerraron acá mismo (pedido explícito del usuario,
      // 2026-09-24: "que el agente tenga la visual de qué casos con ID
      // se pasó al back").
      estadoOpciones={[
        { value: 'cerrado', label: 'Cerrado' },
        { value: 'escalado_backoffice', label: 'Escalado a BackOffice' },
      ]}
      title="Casos gestionados"
      description="Casos ya cerrados o escalados a BackOffice."
      emptyIcon={CheckCircle2}
      emptyTitle="Todavía no hay casos gestionados"
      emptyDescription="Los casos que cierres o escales a BackOffice aparecerán aquí."
      detailBasePath="/postventa/casos"
    />
  )
}
