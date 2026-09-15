import { ListChecks, CheckCircle2, Undo2 } from 'lucide-react'
import { Shell } from './Shell'
import type { NavItem } from './Sidebar'

const items: NavItem[] = [
  { to: '/', label: 'Cola de pendientes', icon: ListChecks, end: true },
  { to: '/completados', label: 'Completados', icon: CheckCircle2 },
  { to: '/rechazados', label: 'Rechazados', icon: Undo2 },
]

export function BackofficeShell() {
  return <Shell items={items} roleLabel="BackOffice" />
}
