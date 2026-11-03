import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArchiveRestore, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { SearchSelect } from '@/components/common/SearchSelect'
import { CopyableId } from '@/components/common/CopyableId'
import { usePapelera, useRestaurarPapelera } from '@/hooks/admin'
import { apiErrorMessage } from '@/lib/api'
import type { ClienteEliminado } from '@/lib/types'
import { useUsuarios } from '@/hooks/usuarios'
import { useEmpresas } from '@/hooks/catalogos'
import { ESTADO_CLIENTE_LABEL, ESTADO_CLIENTE_COLOR } from '@/lib/clienteConstants'
import { fmtDateTime, onChangeFechaFiltro } from '@/lib/dateFormat'

const ROL_LABEL: Record<string, string> = { agente: 'Agente', supervisor: 'Supervisor', admin: 'Admin' }

/**
 * "Papelera" — solo admin (2026-09-26, pedido del usuario). Es la foto que
 * deja eliminarCliente() antes de borrar: quién lo borró, cuándo y desde
 * dónde.
 *
 * Desde 2026-11-03 también se puede devolver a venta, eligiendo el agente.
 * Lo eliminado desde esa fecha trae copia completa y vuelve con el mismo ID
 * y todo lleno; lo eliminado antes solo tiene nombre y contacto, así que el
 * agente lo vuelve a registrar (le aparece en "Nuevo registro").
 */
function DevolverAVentaDialog({ row, onClose }: { row: ClienteEliminado | null; onClose: () => void }) {
  const navigate = useNavigate()
  const restaurar = useRestaurarPapelera()
  const { data: agentesTodos } = useUsuarios('agente')
  const [agenteId, setAgenteId] = useState('all')
  const [observacion, setObservacion] = useState('')

  // Misma regla que "Reasignar": agentes activos de la empresa del dueño original.
  const agentes = (agentesTodos ?? []).filter(
    (a) => a.is_active && (row?.empresa_id == null || a.empresa_id === row.empresa_id)
  )

  function cerrar() {
    setAgenteId('all')
    setObservacion('')
    onClose()
  }

  async function onConfirmar() {
    if (!row || agenteId === 'all') return
    try {
      const r = await restaurar.mutateAsync({ id: row.id, agente_id: Number(agenteId), observacion: observacion.trim() || undefined })
      if (r.modo === 'restaurado') {
        toast.success(`ID ${r.cliente_id} restaurado — quedó en borrador del agente elegido`, {
          action: { label: 'Ver', onClick: () => navigate(`/clientes/${r.cliente_id}`) },
        })
      } else {
        toast.success('Asignado — el agente lo verá en "Nuevo registro" para volver a registrarlo')
      }
      cerrar()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo devolver a venta'))
    }
  }

  return (
    <Dialog open={!!row} onOpenChange={(v) => !v && cerrar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Devolver a venta</DialogTitle>
          <DialogDescription>
            {row?.tiene_copia ? (
              <>
                <strong>{row.nombres} {row.apellidos}</strong> vuelve con el <strong>mismo ID ({row.cliente_id_original})</strong>,
                todos los pasos llenos y sus documentos, como <strong>borrador</strong> del agente que elijas. De ahí sigue el
                flujo normal: el agente lo revisa y lo envía a BackOffice.
              </>
            ) : (
              <>
                <strong>{row?.nombres} {row?.apellidos}</strong> se eliminó antes de que la papelera guardara copias
                completas: solo quedó el nombre, SSN, correo y teléfono. El agente lo verá en «Nuevo registro» con esos
                datos puestos y tendrá que completar lo demás. Quedará con un <strong>ID nuevo</strong>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Agente</Label>
            <SearchSelect
              value={agenteId}
              onValueChange={setAgenteId}
              options={agentes.map((a) => ({ value: String(a.id), label: a.name }))}
              placeholder="Buscar agente..."
              allLabel="Selecciona un agente..."
            />
            <p className="text-xs text-muted-foreground">Solo agentes activos de la misma empresa del dueño original ({row?.agente_nombre}).</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="obs-restaurar">Observación (opcional)</Label>
            <Textarea
              id="obs-restaurar"
              placeholder="Por qué vuelve a venta, si aplica..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={cerrar} disabled={restaurar.isPending}>
            Cancelar
          </Button>
          <Button onClick={onConfirmar} disabled={restaurar.isPending || agenteId === 'all'}>
            {restaurar.isPending ? 'Enviando...' : 'Devolver a venta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Qué pasó con la fila después de eliminarse: devuelta a venta o no. */
function EstadoRestauracion({ r, onDevolver }: { r: ClienteEliminado; onDevolver: () => void }) {
  const navigate = useNavigate()
  if (!r.restaurado_at) {
    return (
      <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onDevolver}>
        <ArchiveRestore className="size-3.5" /> Devolver a venta
      </Button>
    )
  }
  return (
    <div className="text-xs">
      <p className="font-medium text-emerald-600 dark:text-emerald-400">Devuelto a venta</p>
      <p className="text-muted-foreground">
        → {r.restaurado_agente_nombre} · {fmtDateTime(r.restaurado_at)}
      </p>
      {r.restaurado_cliente_id ? (
        <button className="text-primary underline-offset-2 hover:underline" onClick={() => navigate(`/clientes/${r.restaurado_cliente_id}`)}>
          Ver ID {r.restaurado_cliente_id}
        </button>
      ) : (
        <p className="text-muted-foreground">Esperando que el agente lo registre</p>
      )}
    </div>
  )
}

export default function PapeleraPage() {
  const [q, setQ] = useState('')
  const [agenteId, setAgenteId] = useState('all')
  const [empresaId, setEmpresaId] = useState('all')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [page, setPage] = useState(1)
  const [devolver, setDevolver] = useState<ClienteEliminado | null>(null)

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
      <PageHeader
        title="Papelera"
        description="Registros que se eliminaron — quién lo hizo y cuándo. Desde acá puedes devolverlos a venta con el agente que elijas."
      />

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
                  <th className="px-4 py-2.5 font-medium">IP</th>
                  <th className="px-4 py-2.5 font-medium">Observación</th>
                  <th className="px-4 py-2.5 font-medium">Volver a venta</th>
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
                    <td className="px-4 py-2.5 tabular-nums text-xs text-muted-foreground">{r.ip_origen ?? '—'}</td>
                    <td className="max-w-64 px-4 py-2.5 text-xs text-muted-foreground">
                      {r.observacion ? <span className="line-clamp-2" title={r.observacion}>{r.observacion}</span> : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <EstadoRestauracion r={r} onDevolver={() => setDevolver(r)} />
                    </td>
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

      <DevolverAVentaDialog row={devolver} onClose={() => setDevolver(null)} />
    </div>
  )
}
