import { FilePlus2, Users, Undo2 } from 'lucide-react'
import { Shell } from './Shell'
import type { NavItem } from './Sidebar'

const items: NavItem[] = [
  { to: '/nuevo', label: 'Nuevo registro', icon: FilePlus2 },
  { to: '/', label: 'Mis clientes', icon: Users, end: true },
  { to: '/rechazados', label: 'Rechazados por BackOffice', icon: Undo2 },
]

export function AgentShell() {
  return <Shell items={items} roleLabel="Agente" />
}
