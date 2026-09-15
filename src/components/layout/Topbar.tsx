import { useNavigate } from 'react-router-dom'
import { Menu, Moon, Sun, LogOut, User as UserIcon } from 'lucide-react'
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
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ROLE_LABEL } from '@/lib/roles'

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, toggleTheme } = useUiStore()
  const navigate = useNavigate()
  const isDark = document.documentElement.classList.contains('dark')

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenSidebar}>
        <Menu className="size-5" />
      </Button>

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
    </header>
  )
}
