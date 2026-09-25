import { LayoutDashboard, FileSpreadsheet, Headphones, Trash2 } from 'lucide-react'
import { Shell } from './Shell'
import type { NavItem } from './Sidebar'

// "Usuarios del sistema" se quitó del menú de admin a pedido del usuario
// (2026-09-22) — "el admin no puede gestionar usuarios". La ruta /usuarios
// y UsuariosPage.tsx siguen existiendo (backend también las bloquea, ver
// usuariosSistema.routes.js) por si se reactiva más adelante; para volver a
// mostrar el link acá: restaurar el import de `Users` y esta fila.
//
// "Aseguradoras" se quitó igual (2026-09-26) — "él no las coloca, cuando
// hay que alimentarlo me dicen a mí". CatalogosPage.tsx sigue existiendo
// (backend también bloqueado, ver catalogos.routes.js) por si se reactiva;
// para volver a mostrar el link: restaurar el import de `ShieldCheck` y
// esta fila.
const items: NavItem[] = [
  { to: '/', label: 'Panel general', icon: LayoutDashboard, end: true },
  { to: '/reporte', label: 'Reporte consolidado', icon: FileSpreadsheet },
  { to: '/postventa', label: 'Postventa', icon: Headphones },
  { to: '/papelera', label: 'Papelera', icon: Trash2 },
]

export function AdminShell() {
  return <Shell items={items} roleLabel="Administrador" />
}
