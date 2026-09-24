import { ListTodo } from 'lucide-react'
import { CasosPostventaTable } from '@/components/casosPostventa/CasosPostventaTable'

export default function CasosPorGestionarPage() {
  return (
    <CasosPostventaTable
      estadosBase={['nuevo', 'seguimiento']}
      estadoOpciones={[
        { value: 'nuevo', label: 'Nuevo' },
        { value: 'seguimiento', label: 'Seguimiento' },
      ]}
      title="Casos por gestionar"
      description="Casos de postventa abiertos, esperando seguimiento o cierre."
      emptyIcon={ListTodo}
      emptyTitle="No hay casos por gestionar"
      emptyDescription="Cuando valides un cliente y crees un caso, aparecerá aquí."
      detailBasePath="/postventa/casos"
    />
  )
}
