import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { CopyableId } from '@/components/common/CopyableId'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useColaBackoffice } from '@/hooks/backoffice'
import { useUsuarios } from '@/hooks/usuarios'
import { fmtDateTime } from '@/lib/dateFormat'

function diasDesde(iso: string) {
  const ms = Date.now() - new Date(iso.replace(' ', 'T')).getTime()
  return Math.floor(ms / 86_400_000)
}

/** Insignia de antigüedad — solo tiene sentido en la cola de pendientes: entre
 * más tiempo lleve un registro sin moverse, más urge que alguien lo revise. */
function Antiguedad({ iso }: { iso: string }) {
  const dias = diasDesde(iso)
  if (dias < 2) return <span className="text-xs text-muted-foreground">hoy</span>
  const cls =
    dias >= 4
      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>
      {dias} día{dias === 1 ? '' : 's'} esperando
    </span>
  )
}

export function ClientesEstadoTable({
  estado,
  title,
  description,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  dateLabel,
  dateField,
  mostrarAntiguedad,
}: {
  estado: string
  title: string
  description: string
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  dateLabel: string
  dateField: 'submitted_at' | 'updated_at'
  /** Muestra cuántos días lleva esperando, resaltado si se está demorando (solo tiene sentido en la cola). */
  mostrarAntiguedad?: boolean
}) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [agenteId, setAgenteId] = useState('all')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const { data, isLoading } = useColaBackoffice(estado, {
    q: q || undefined,
    agenteId: agenteId === 'all' ? undefined : agenteId,
    desde: desde || undefined,
    hasta: hasta || undefined,
  })
  const { data: agentes } = useUsuarios('agente')
  const hayFiltros = !!q || agenteId !== 'all' || !!desde || !!hasta

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      <div className="flex flex-wrap items-end gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-9 w-56 pl-8" placeholder="Nombre, correo, SSN, teléfono, ID..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={agenteId} onValueChange={setAgenteId}>
          <SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier agente</SelectItem>
            {agentes?.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          {/* lang="en-US": el picker nativo de <input type=date> se muestra en
              el idioma de la página (día/mes/año con lang="es" del sitio) —
              esto lo fuerza a mes/día/año en Chrome/Edge. Firefox no respeta
              `lang` acá, solo el locale del SO. */}
          <Input type="date" lang="en-US" className="h-9 w-36" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input type="date" lang="en-US" className="h-9 w-36" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        {hayFiltros && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 self-end"
            onClick={() => {
              setQ('')
              setAgenteId('all')
              setDesde('')
              setHasta('')
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : !data?.length ? (
        <EmptyState
          icon={emptyIcon}
          title={hayFiltros ? 'Nada con esos filtros' : emptyTitle}
          description={hayFiltros ? 'Prueba con otro nombre, agente o rango de fechas.' : emptyDescription}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">ID</th>
                  <th className="px-4 py-2.5 font-medium">Cliente</th>
                  <th className="px-4 py-2.5 font-medium">Contacto</th>
                  <th className="px-4 py-2.5 font-medium">Agente</th>
                  <th className="px-4 py-2.5 font-medium">{dateLabel}</th>
                  {mostrarAntiguedad && <th className="px-4 py-2.5 font-medium">Antigüedad</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/clientes/${c.id}`)} className="cursor-pointer border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5"><CopyableId id={c.id} /></td>
                    <td className="px-4 py-2.5 font-medium">{c.nombres} {c.apellidos}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.correo_electronico} · {c.phone_1}</td>
                    <td className="px-4 py-2.5">{c.agente_nombre}</td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{fmtDateTime(c[dateField])}</td>
                    {mostrarAntiguedad && (
                      <td className="px-4 py-2.5">{c.submitted_at && <Antiguedad iso={c.submitted_at} />}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
