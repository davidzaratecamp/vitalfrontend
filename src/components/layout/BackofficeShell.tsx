import { ListChecks, CheckCircle2, Undo2, Headphones, PhoneCall } from 'lucide-react'
import { Shell } from './Shell'
import type { NavItem } from './Sidebar'

const items: NavItem[] = [
  { to: '/', label: 'Cola de pendientes', icon: ListChecks, end: true },
  { to: '/pendiente-tripartita', label: 'Pendiente llamada tripartita', icon: PhoneCall },
  { to: '/completados', label: 'Completados', icon: CheckCircle2 },
  { to: '/rechazados', label: 'Rechazados', icon: Undo2 },
  { to: '/postventa', label: 'Postventa', icon: Headphones },
]

export function BackofficeShell() {
  return <Shell items={items} roleLabel="BackOffice" />
}
