import { LayoutDashboard, FileSpreadsheet, ShieldCheck, Headphones, Trash2 } from 'lucide-react'
import { Shell } from './Shell'
import type { NavItem } from './Sidebar'

// "Usuarios del sistema" se quitó del menú de admin a pedido del usuario
// (2026-09-22) — "el admin no puede gestionar usuarios". La ruta /usuarios
// y UsuariosPage.tsx siguen existiendo (backend también las bloquea, ver
// usuariosSistema.routes.js) por si se reactiva más adelante; para volver a
// mostrar el link acá: restaurar el import de `Users` y esta fila.
const items: NavItem[] = [
  { to: '/', label: 'Panel general', icon: LayoutDashboard, end: true },
  { to: '/reporte', label: 'Reporte consolidado', icon: FileSpreadsheet },
  { to: '/postventa', label: 'Postventa', icon: Headphones },
  { to: '/papelera', label: 'Papelera', icon: Trash2 },
  { to: '/catalogos', label: 'Aseguradoras', icon: ShieldCheck },
]

export function AdminShell() {
  return <Shell items={items} roleLabel="Administrador" />
}
