import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchSelect } from '@/components/common/SearchSelect'
import { CopyableId } from '@/components/common/CopyableId'
import { usePapelera } from '@/hooks/admin'
import { useUsuarios } from '@/hooks/usuarios'
import { useEmpresas } from '@/hooks/catalogos'
import { ESTADO_CLIENTE_LABEL, ESTADO_CLIENTE_COLOR } from '@/lib/clienteConstants'
import { fmtDateTime, onChangeFechaFiltro } from '@/lib/dateFormat'

const ROL_LABEL: Record<string, string> = { agente: 'Agente', supervisor: 'Supervisor', admin: 'Admin' }

/**
 * "Papelera" — solo admin (2026-09-26, pedido del usuario). Es la foto que
 * deja eliminarCliente() antes de borrar un borrador/rechazado — no un
 * cliente recuperable: dependientes, evidencias y todo lo demás sí se
 * pierden. Esto es un registro de auditoría (qué existió, quién lo borró y
 * cuándo), no una papelera de reciclaje en el sentido literal.
 */
export default function PapeleraPage() {
  const [q, setQ] = useState('')
  const [agenteId, setAgenteId] = useState('all')
  const [empresaId, setEmpresaId] = useState('all')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [page, setPage] = useState(1)

  const { data: agentes } = useUsuarios('agente')
  const { data: empresas } = useEmpresas()
  const filters = {
    q: q || undefined,
    agenteId: agenteId === 'all' ? undefined : agenteId,
    empresaId: empresaId === 'all' ? undefined : empresaId,
    desde: desde || undefined,
    hasta: hasta || undefined,
    page,
    pageSize: 50,
  }
  const { data, isLoading, isFetching } = usePapelera(filters)

  return (
    <div className="space-y-6">
      <PageHeader title="Papelera" description="Borradores y rechazados que se eliminaron — quién lo hizo y cuándo." />

      <div className="flex flex-wrap items-end gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 w-56 pl-8"
            placeholder="Nombre, correo, SSN, ID..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
          />
        </div>
        <SearchSelect
          className="w-56"
          value={agenteId}
          onValueChange={(v) => { setAgenteId(v); setPage(1) }}
          options={(agentes ?? []).map((a) => ({ value: String(a.id), label: a.name }))}
          placeholder="Buscar agente..."
          allLabel="Cualquier agente"
        />
        <Select value={empresaId} onValueChange={(v) => { setEmpresaId(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier empresa</SelectItem>
            {empresas?.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <Input type="date" lang="en-US" className="h-9" value={desde} onChange={(e) => { onChangeFechaFiltro(e.target.value, setDesde); setPage(1) }} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input type="date" lang="en-US" className="h-9" value={hasta} onChange={(e) => { onChangeFechaFiltro(e.target.value, setHasta); setPage(1) }} />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : !data || data.rows.length === 0 ? (
        <EmptyState icon={Trash2} title="Nada en la papelera para estos filtros" />
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
                  <th className="px-4 py-2.5 font-medium">Estado antes de borrar</th>
                  <th className="px-4 py-2.5 font-medium">Eliminado por</th>
                  <th className="px-4 py-2.5 font-medium">Eliminado el</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5"><CopyableId id={r.cliente_id_original} /></td>
                    <td className="px-4 py-2.5 font-medium">{r.nombres} {r.apellidos}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.correo_electronico ?? '—'} · {r.phone_1 ?? '—'}</td>
                    <td className="px-4 py-2.5">{r.agente_nombre}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${ESTADO_CLIENTE_COLOR[r.estado_previo]}`}>
                        {ESTADO_CLIENTE_LABEL[r.estado_previo]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">{r.eliminado_por_nombre} <span className="text-xs text-muted-foreground">({ROL_LABEL[r.eliminado_por_rol]})</span></td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{fmtDateTime(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-2.5 text-sm text-muted-foreground">
            <span>{data.total.toLocaleString('es-CO')} eliminados · página {data.page}/{data.total_pages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft className="size-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= data.total_pages || isFetching} onClick={() => setPage((p) => p + 1)}><ChevronRight className="size-4" /></Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
