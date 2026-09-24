import { FilePlus2, Users, Undo2, UserSearch, ListTodo, CheckCircle2 } from 'lucide-react'
import { Shell } from './Shell'
import type { NavItem } from './Sidebar'

// Dos grupos bien separados (2026-09-24: el rol Customer se integró acá —
// "el customer es el mismo agente" — con el pedido explícito de que las
// pestañas queden claras): "Ventas" es el flujo de siempre; "Postventa" es
// todo lo que hacía Customer (validar un cliente ya aprobado por teléfono y
// gestionar su caso). TopNav pinta un separador + etiqueta entre grupos.
const items: NavItem[] = [
  { to: '/nuevo', label: 'Nuevo registro', icon: FilePlus2, group: 'Ventas' },
  { to: '/', label: 'Mis clientes', icon: Users, end: true, group: 'Ventas' },
  { to: '/rechazados', label: 'Rechazados por BackOffice', icon: Undo2, group: 'Ventas' },
  { to: '/postventa', label: 'Validar cliente', icon: UserSearch, end: true, group: 'Postventa' },
  { to: '/postventa/por-gestionar', label: 'Por gestionar', icon: ListTodo, group: 'Postventa' },
  { to: '/postventa/gestionados', label: 'Gestionados', icon: CheckCircle2, group: 'Postventa' },
]

export function AgentShell() {
  return <Shell items={items} roleLabel="Agente" />
}
