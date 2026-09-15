import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, UserX, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/common/EmptyState'
import { useAuthStore } from '@/stores/auth'
import {
  useNotificaciones,
  useNotificacionesNoLeidas,
  useMarcarLeida,
  useMarcarTodasLeidas,
} from '@/hooks/notificaciones'
import type { Notificacion } from '@/lib/types'

function tiempoDesde(iso: string) {
  const ms = Date.now() - new Date(iso.replace(' ', 'T')).getTime()
  const min = Math.round(ms / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.round(h / 24)} d`
}

export function NotificationBell() {
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.user?.role)
  const { data: count = 0 } = useNotificacionesNoLeidas()
  const { data: notificaciones } = useNotificaciones()
  const marcarLeida = useMarcarLeida()
  const marcarTodas = useMarcarTodasLeidas()

  function irAlCliente(n: Notificacion) {
    if (!n.leida) marcarLeida.mutate(n.id)
    if (n.cliente_id == null) return
    const path = role === 'agente' ? `/clientes/${n.cliente_id}/editar` : `/clientes/${n.cliente_id}`
    navigate(path)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Notificaciones">
          <Bell className="size-4" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-medium">Notificaciones</p>
          {count > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => marcarTodas.mutate()}>
              <CheckCheck className="size-3.5" /> Marcar todas
            </Button>
          )}
        </div>
        {!notificaciones?.length ? (
          <div className="py-6">
            <EmptyState icon={Bell} title="Sin notificaciones" description="Los rechazos y nuevos pendientes aparecen acá." />
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="divide-y">
              {notificaciones.map((n) => (
                <button
                  key={n.id}
                  onClick={() => irAlCliente(n)}
                  className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent ${!n.leida ? 'bg-primary/5' : ''}`}
                >
                  <span className="mt-0.5 shrink-0 text-muted-foreground">
                    {n.tipo === 'rechazo' ? <UserX className="size-4" /> : <ListChecks className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block ${!n.leida ? 'font-medium' : ''}`}>{n.mensaje}</span>
                    <span className="text-xs text-muted-foreground">{tiempoDesde(n.created_at)}</span>
                  </span>
                  {!n.leida && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
