import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { HeartPulse, Moon, Sun, LogOut, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/common/UserAvatar'
import { NotificationBell } from './NotificationBell'
import type { NavItem } from './Sidebar'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ROLE_LABEL } from '@/lib/roles'
import { cn } from '@/lib/utils'

/**
 * Variante experimental del shell con el menú horizontal arriba en vez del
 * sidebar lateral. Vive aparte de Sidebar.tsx/Topbar.tsx (que quedan intactos
 * y listos para usarse de nuevo) — volver atrás es solo restaurar Shell.tsx.
 */
function itemClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
  )
}

function NavItems({ items }: { items: NavItem[] }) {
  return (
    <>
      {items.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} className={itemClass}>
          <n.icon className="size-4" />
          {n.label}
        </NavLink>
      ))}
    </>
  )
}

/**
 * Switcher Ventas/Postventa (o los grupos que traiga cada `items`) — solo
 * aparece cuando el menú de ese rol realmente usa más de un `group`
 * (AgentShell hoy; BackOffice/Admin/Supervisor no ponen `group` en sus
 * ítems y nunca lo ven). Antes las 6 pestañas de agente iban todas en una
 * sola fila con scroll horizontal — feo e incómodo (2026-09-25, pedido del
 * usuario); ahora se ve un botón para elegir el grupo y solo esas pestañas.
 */
function GroupSwitcher({ groups, active, onChange }: { groups: string[]; active: string; onChange: (g: string) => void }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
      {groups.map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={cn(
            'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
            g === active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {g}
        </button>
      ))}
    </div>
  )
}

export function TopNav({ items, roleLabel }: { items: NavItem[]; roleLabel: string }) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggleTheme } = useUiStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isDark = document.documentElement.classList.contains('dark')

  // Grupos declarados en `items` (ej. "Ventas"/"Postventa"), en el orden en
  // que aparecen — vacío si el rol no usa `group`, y ahí no cambia nada de
  // lo que había antes. El grupo activo sale siempre de la ruta actual
  // (nunca de un estado propio) — así el switcher queda sincronizado
  // también con atrás/adelante del navegador o un link directo, no solo con
  // sus propios botones.
  const groups = [...new Set(items.map((i) => i.group).filter((g): g is string => !!g))]
  const grupoPorRuta = items.find(
    (i) => i.group && (location.pathname === i.to || (i.to !== '/' && location.pathname.startsWith(`${i.to}/`))),
  )?.group
  const grupoActivo = groups.length > 1 ? (grupoPorRuta ?? groups[0]) : null

  function cambiarGrupo(g: string) {
    const destino = items.find((i) => i.group === g && i.end) ?? items.find((i) => i.group === g)
    if (destino) navigate(destino.to)
  }

  const itemsVisibles = grupoActivo ? items.filter((i) => !i.group || i.group === grupoActivo) : items

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Vital</p>
            <p className="text-[11px] text-muted-foreground">{roleLabel}</p>
          </div>
        </div>

        {groups.length > 1 && <GroupSwitcher groups={groups} active={grupoActivo!} onChange={cambiarGrupo} />}

        <nav className="hidden items-center gap-1 overflow-x-auto md:flex">
          <NavItems items={itemsVisibles} />
        </nav>

        <div className="flex-1" />

        <NotificationBell />

        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Cambiar tema">
          {isDark || theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-accent">
              <UserAvatar name={user?.name} color={user?.avatar_color} size="sm" />
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-xs font-medium">{user?.name}</p>
                <p className="text-[11px] text-muted-foreground">{user ? ROLE_LABEL[user.role] : ''}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/ajustes')}>
              <UserIcon className="size-4" /> Mi perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              <LogOut className="size-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* En móvil el menú no cabe junto a la marca — baja como tira con scroll horizontal. */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t px-4 py-1.5 md:hidden">
        <NavItems items={itemsVisibles} />
      </nav>
    </header>
  )
}
