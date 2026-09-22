import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchSelect } from '@/components/common/SearchSelect'
import { useReporte, descargarReporteCsv } from '@/hooks/admin'
import { useUsuarios } from '@/hooks/usuarios'
import { useEmpresas } from '@/hooks/catalogos'
import { useAuthStore } from '@/stores/auth'
import { apiErrorMessage } from '@/lib/api'
import { ESTADO_CLIENTE_LABEL, ESTADO_CLIENTE_COLOR } from '@/lib/clienteConstants'
import { fmtDate } from '@/lib/dateFormat'

export default function ReportePage() {
  const navigate = useNavigate()
  const esAdmin = useAuthStore((s) => s.user?.role) === 'admin'
  const [estado, setEstado] = useState('all')
  const [agenteId, setAgenteId] = useState('all')
  // Solo admin puede elegir — supervisor ve la suya sin desplegable, el
  // backend la fuerza siempre, sin importar lo que se mande acá.
  const [empresaId, setEmpresaId] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [downloading, setDownloading] = useState(false)

  const { data: agentes } = useUsuarios('agente')
  const { data: empresas } = useEmpresas()
  const filters = {
    estado: estado === 'all' ? undefined : estado,
    agenteId: agenteId === 'all' ? undefined : agenteId,
    empresaId: esAdmin && empresaId !== 'all' ? empresaId : undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    pageSize: 50,
  }
  const { data, isLoading, isFetching } = useReporte(filters)

  async function exportar() {
    setDownloading(true)
    try {
      await descargarReporteCsv(filters)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo exportar'))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporte consolidado"
        description="Todos los registros, con filtros y exportación a CSV."
        actions={
          <Button variant="outline" onClick={exportar} disabled={downloading}>
            {downloading ? <FileSpreadsheet className="size-4 animate-pulse" /> : <Download className="size-4" />}
            {downloading ? 'Generando...' : 'Exportar CSV'}
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-2">
        <Select value={estado} onValueChange={(v) => { setEstado(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier estado</SelectItem>
            {Object.entries(ESTADO_CLIENTE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <SearchSelect
          className="w-56"
          value={agenteId}
          onValueChange={(v) => { setAgenteId(v); setPage(1) }}
          options={(agentes ?? []).map((a) => ({ value: String(a.id), label: a.name }))}
          placeholder="Buscar agente..."
          allLabel="Cualquier agente"
        />
        {esAdmin && (
          <Select value={empresaId} onValueChange={(v) => { setEmpresaId(v); setPage(1) }}>
            <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier empresa</SelectItem>
              {empresas?.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          {/* lang="en-US" fuerza mes/día/año en el picker nativo (Chrome/Edge
              lo muestran en el idioma de la página, "es", si no se indica). */}
          <Input type="date" lang="en-US" className="h-9" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input type="date" lang="en-US" className="h-9" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : !data || data.rows.length === 0 ? (
        <EmptyState icon={FileSpreadsheet} title="Sin registros para estos filtros" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Cliente</th>
                  <th className="px-4 py-2.5 font-medium">SSN</th>
                  <th className="px-4 py-2.5 font-medium">Ubicación</th>
                  <th className="px-4 py-2.5 font-medium">Origen</th>
                  <th className="px-4 py-2.5 font-medium">Agente</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 font-medium">Creado</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/clientes/${r.id}`)} className="cursor-pointer border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">{r.nombres} {r.apellidos}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.social}</td>
                    <td className="px-4 py-2.5">{r.ciudad}, {r.estado_us}</td>
                    <td className="px-4 py-2.5">{r.origen_venta}</td>
                    <td className="px-4 py-2.5">{r.agente_nombre}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${ESTADO_CLIENTE_COLOR[r.estado]}`}>{ESTADO_CLIENTE_LABEL[r.estado]}</span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-2.5 text-sm text-muted-foreground">
            <span>{data.total.toLocaleString('es-CO')} registros · página {data.page}/{data.total_pages}</span>
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
