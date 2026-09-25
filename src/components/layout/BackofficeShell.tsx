import { ListChecks, CheckCircle2, Undo2, Headphones, PhoneCall, CheckCheck } from 'lucide-react'
import { Shell } from './Shell'
import type { NavItem } from './Sidebar'

// Mismo switcher Ventas/Postventa que AgentShell (2026-09-25, pedido del
// usuario) — con Postventa + "Pendiente llamada tripartita" sumadas, el
// nav horizontal ya no entraba sin scroll.
const items: NavItem[] = [
  { to: '/', label: 'Cola de pendientes', icon: ListChecks, end: true, group: 'Ventas' },
  { to: '/pendiente-tripartita', label: 'Pendiente llamada tripartita', icon: PhoneCall, group: 'Ventas' },
  { to: '/completados', label: 'Completados', icon: CheckCircle2, group: 'Ventas' },
  { to: '/rechazados', label: 'Rechazados', icon: Undo2, group: 'Ventas' },
  { to: '/postventa', label: 'Postventa', icon: Headphones, end: true, group: 'Postventa' },
  { to: '/postventa/gestionados', label: 'Postventa gestionados', icon: CheckCheck, group: 'Postventa' },
]

export function BackofficeShell() {
  return <Shell items={items} roleLabel="BackOffice" />
}
