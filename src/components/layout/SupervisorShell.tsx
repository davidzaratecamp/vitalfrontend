import { LayoutDashboard, FileSpreadsheet, Headphones, RefreshCw } from 'lucide-react'
import { Shell } from './Shell'
import type { NavItem } from './Sidebar'

// Reutiliza exactamente las mismas pantallas de solo-lectura que admin
// (Panel general, Reporte consolidado, vista de cliente, Postventa) — el
// supervisor ve todos los casos de todos los agentes, pero no tiene
// Usuarios ni Catálogos porque esas sí son de edición. "Postventa"
// (2026-09-29, pedido del usuario) — solo lectura, mismo componente que
// usa admin, ver pages/supervisor/PostventaPage.tsx.
const items: NavItem[] = [
  { to: '/', label: 'Panel general', icon: LayoutDashboard, end: true },
  { to: '/reporte', label: 'Reporte consolidado', icon: FileSpreadsheet },
  { to: '/postventa', label: 'Postventa', icon: Headphones },
  // Renovaciones (2026-10-27) — misma pantalla que admin, solo lectura: el
  // botón de abrir temporada solo lo ve admin (ver PanelRenovacionesPage).
  { to: '/renovaciones', label: 'Renovaciones', icon: RefreshCw },
]

export function SupervisorShell() {
  return <Shell items={items} roleLabel="Supervisor" />
}
