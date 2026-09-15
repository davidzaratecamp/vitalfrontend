import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { List } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MiniBarRow {
  label: string
  value: number
  /** texto a la derecha; si falta se muestra `value` */
  display?: string
  color?: string
}

/** Lista compacta tipo "barra de progreso" para desgloses. */
export function MiniBarList({
  title,
  rows,
  emptyLabel = 'Sin datos',
  className,
}: {
  title: string
  rows: MiniBarRow[]
  emptyLabel?: string
  className?: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState icon={List} title={emptyLabel} />
        ) : (
          <ul className="space-y-2.5">
            {rows.map((r) => (
              <li key={r.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate text-muted-foreground">{r.label}</span>
                  <span className="tabular-nums font-medium">{r.display ?? r.value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', !r.color && 'bg-primary')}
                    style={{ width: `${(r.value / max) * 100}%`, background: r.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
