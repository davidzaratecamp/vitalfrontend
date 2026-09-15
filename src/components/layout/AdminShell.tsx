import { LayoutDashboard, FileSpreadsheet, Users, ShieldCheck } from 'lucide-react'
import { Shell } from './Shell'
import type { NavItem } from './Sidebar'

const items: NavItem[] = [
  { to: '/', label: 'Panel general', icon: LayoutDashboard, end: true },
  { to: '/reporte', label: 'Reporte consolidado', icon: FileSpreadsheet },
  { to: '/usuarios', label: 'Usuarios del sistema', icon: Users },
  { to: '/catalogos', label: 'Aseguradoras', icon: ShieldCheck },
]

export function AdminShell() {
  return <Shell items={items} roleLabel="Administrador" />
}
