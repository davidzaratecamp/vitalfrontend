import { LayoutDashboard, FileSpreadsheet } from 'lucide-react'
import { Shell } from './Shell'
import type { NavItem } from './Sidebar'

// Reutiliza exactamente las mismas pantallas de solo-lectura que admin
// (Panel general, Reporte consolidado, vista de cliente) — el supervisor
// ve todos los casos de todos los agentes, pero no tiene Usuarios ni
// Catálogos porque esas sí son de edición.
const items: NavItem[] = [
  { to: '/', label: 'Panel general', icon: LayoutDashboard, end: true },
  { to: '/reporte', label: 'Reporte consolidado', icon: FileSpreadsheet },
]

export function SupervisorShell() {
  return <Shell items={items} roleLabel="Supervisor" />
}
