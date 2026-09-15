import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
}

function itemClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
  )
}

export function Sidebar({
  items,
  roleLabel,
  onNavigate,
}: {
  items: NavItem[]
  roleLabel: string
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <HeartPulse className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Vital</p>
          <p className="text-[11px] text-muted-foreground">{roleLabel}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1 py-2">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={itemClass} onClick={onNavigate}>
              <n.icon className="size-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}
