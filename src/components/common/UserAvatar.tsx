import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { initials } from '@/lib/status'
import { cn } from '@/lib/utils'

interface Props {
  name?: string | null
  color?: string | null
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

const sizeMap = { xs: 'size-6 text-[10px]', sm: 'size-7 text-[11px]', md: 'size-9 text-xs' }

export function UserAvatar({ name, color, size = 'sm', className }: Props) {
  const label = name || 'Sin asignar'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar className={cn(sizeMap[size], className)}>
          <AvatarFallback
            style={name ? { background: `${color || '#64748b'}`, color: '#fff' } : undefined}
          >
            {name ? initials(name) : '·'}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function AvatarStack({
  people,
  max = 4,
}: {
  people: { name: string; avatar_color: string }[]
  max?: number
}) {
  const shown = people.slice(0, max)
  const rest = people.length - shown.length
  return (
    <div className="flex -space-x-2">
      {shown.map((p, i) => (
        <UserAvatar key={i} name={p.name} color={p.avatar_color} size="xs" className="ring-2 ring-card" />
      ))}
      {rest > 0 && (
        <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-card">
          +{rest}
        </div>
      )}
    </div>
  )
}
