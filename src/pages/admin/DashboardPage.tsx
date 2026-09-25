import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  Users,
  Clock,
  Headphones,
  Search,
  RotateCcw,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { SearchSelect } from '@/components/common/SearchSelect'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDashboard } from '@/hooks/admin'
import { useUsuarios } from '@/hooks/usuarios'
import { useEmpresas } from '@/hooks/catalogos'
import { useAuthStore } from '@/stores/auth'
import { pct, num } from '@/lib/analyticsFormat'
import { onChangeFechaFiltro } from '@/lib/dateFormat'
import { ESTADO_CLIENTE_LABEL, ORIGEN_VENTA_LABEL, ESTADO_FIRMA_LABEL } from '@/lib/clienteConstants'
import { TIPO_CASO_POSTVENTA_LABEL, ESTADO_CASO_POSTVENTA_LABEL } from '@/lib/casosPostventaConstants'

const TIP = { background: 'var(--color-popover)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }
const AXIS_TICK = { fontSize: 11, fill: 'var(--color-muted-foreground)' }

// Paleta semántica — coherente con las pastillas de estado del resto de la
// app (bg-amber-500/10, bg-emerald-500/10, etc. en clienteConstants.ts),
// pero en hex: los gráficos de Recharts pintan un <path fill>, no aceptan
// clases de Tailwind.
const COLOR_ESTADO: Record<string, string> = {
  borrador: '#94a3b8',
  pendiente_backoffice: '#f59e0b',
  pendiente_llamada_tripartita: '#0ea5e9',
  aprobado: '#10b981',
  rechazado_backoffice: '#ef4444',
}
const COLOR_ESTADO_CASO: Record<string, string> = {
  nuevo: '#6366f1',
  seguimiento: '#f59e0b',
  cerrado: '#10b981',
  escalado_backoffice: '#a855f7',
}
const COLOR_FIRMA: Record<string, string> = {
  pending: '#f59e0b',
  viewed: '#6366f1',
  signed: '#10b981',
  expired: '#eab308',
  failed: '#ef4444',
}
const PALETA = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6']

function fmtDia(d: string) {
  return d.slice(5).replace('-', '/')
}

/** Barra horizontal simple (sin eje, con etiqueta y valor) — para rankings
 * cortos donde un BarChart completo de Recharts sería más pesado que útil. */
function BarraHorizontal({ label, value, max, color, suffix }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const w = max > 0 ? Math.max(3, Math.round((value / max) * 100)) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="shrink-0 font-medium tabular-nums">{num(value)}{suffix}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function DonutCard({
  title,
  icon: Icon,
  data,
  colorFn,
  labelFn,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  data: { key: string; value: number }[]
  colorFn: (key: string, i: number) => string
  labelFn: (key: string) => string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Icon className="size-4" /> {title}</CardTitle></CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState icon={Icon} title="Sin datos" className="border-none p-4" />
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="key" innerRadius={45} outerRadius={72} paddingAngle={2} strokeWidth={0}>
                  {data.map((d, i) => <Cell key={d.key} fill={colorFn(d.key, i)} />)}
                </Pie>
                <Tooltip
                  contentStyle={TIP}
                  formatter={(v, _n, p) => {
                    const n = Number(v) || 0
                    const key = String((p as { payload?: { key?: string } })?.payload?.key ?? '')
                    return [`${num(n)} (${pct(n / total)})`, labelFn(key)]
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {data.map((d, i) => (
                <div key={d.key} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colorFn(d.key, i) }} />
                    <span className="truncate">{labelFn(d.key)}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">{num(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const esAdmin = useAuthStore((s) => s.user?.role) === 'admin'
  const [q, setQ] = useState('')
  const [agenteId, setAgenteId] = useState('all')
  const [empresaId, setEmpresaId] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data: agentes } = useUsuarios('agente')
  const { data: empresas } = useEmpresas()
  const hayFiltros = !!q || agenteId !== 'all' || empresaId !== 'all' || !!from || !!to
  const filters = {
    q: q || undefined,
    agenteId: agenteId === 'all' ? undefined : agenteId,
    empresaId: esAdmin && empresaId !== 'all' ? empresaId : undefined,
    from: from || undefined,
    to: to || undefined,
  }
  const { data, isLoading, isFetching } = useDashboard(filters)

  function limpiar() {
    setQ('')
    setAgenteId('all')
    setEmpresaId('all')
    setFrom('')
    setTo('')
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Panel general" description="Vista consolidada de todos los registros del CRM." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  const maxAgente = Math.max(1, ...data.por_agente.map((a) => a.total))
  const maxAseguradora = Math.max(1, ...data.aseguradoras.map((a) => a.total))
  const maxTipoCaso = Math.max(1, ...data.postventa.por_tipo.map((t) => t.total))
  const totalPostventa = data.postventa.por_estado.reduce((s, e) => s + e.total, 0)
  const totalFirmas = data.firmas.reduce((s, f) => s + f.total, 0)

  // Embudo Borrador → Pendiente BackOffice/tripartita → Aprobado, con
  // Rechazado como salida — mismo dato que por_estado, presentado como
  // pasos de un proceso en vez de una lista plana.
  const embudo = [
    { key: 'borrador', label: ESTADO_CLIENTE_LABEL.borrador, value: data.por_estado.borrador },
    {
      key: 'pendiente',
      label: 'Pendiente (BackOffice + tripartita)',
      value: data.por_estado.pendiente_backoffice + data.por_estado.pendiente_llamada_tripartita,
    },
    { key: 'aprobado', label: ESTADO_CLIENTE_LABEL.aprobado, value: data.por_estado.aprobado },
  ]
  const maxEmbudo = Math.max(1, ...embudo.map((e) => e.value));

  return (
    <div className="space-y-6">
      <PageHeader title="Panel general" description="Vista consolidada de todos los registros del CRM — filtra por fecha, agente o empresa para explorar." />

      {/* Filtros — el panel entero se recalcula con ellos, no es solo
          decorativo (2026-09-26, pedido del usuario: "algo muy completo...
          interactivo"). */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-9 w-56 pl-8" placeholder="Nombre, correo, SSN, ID..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <SearchSelect
          className="w-56"
          value={agenteId}
          onValueChange={setAgenteId}
          options={(agentes ?? []).map((a) => ({ value: String(a.id), label: a.name }))}
          placeholder="Buscar agente..."
          allLabel="Cualquier agente"
        />
        {esAdmin && (
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier empresa</SelectItem>
              {empresas?.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <Input type="date" lang="en-US" className="h-9" value={from} onChange={(e) => onChangeFechaFiltro(e.target.value, setFrom)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input type="date" lang="en-US" className="h-9" value={to} onChange={(e) => onChangeFechaFiltro(e.target.value, setTo)} />
        </div>
        {hayFiltros && (
          <Button variant="ghost" size="sm" className="h-9" onClick={limpiar}>
            <RotateCcw className="size-3.5" /> Limpiar
          </Button>
        )}
        {isFetching && <span className="self-center text-xs text-muted-foreground">Actualizando...</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Registros totales" value={num(data.total)} icon={ClipboardList} />
        <KpiCard label="Aprobados" value={num(data.por_estado.aprobado)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Tasa de aprobación" value={pct(data.tasa_aprobacion)} icon={TrendingUp} />
        <KpiCard label="Pendientes BackOffice" value={num(data.por_estado.pendiente_backoffice)} icon={Users} tone="warning" />
        <KpiCard
          label="Días promedio hasta aprobar"
          value={data.dias_promedio_aprobacion != null ? data.dias_promedio_aprobacion.toFixed(1) : '—'}
          icon={Clock}
          hint="Desde que se envía a BackOffice"
        />
        <KpiCard label="Casos de Postventa" value={num(totalPostventa)} icon={Headphones} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle className="text-base">Registros vs. aprobados por día</CardTitle></CardHeader>
          <CardContent>
            {data.tendencia.length === 0 ? (
              <EmptyState icon={TrendingUp} title="Sin registros en el rango" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.tendencia} margin={{ left: 4, right: 12, top: 8 }}>
                  <defs>
                    <linearGradient id="gradRegistros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradAprobados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="dia" tickLine={false} axisLine={false} tick={AXIS_TICK} tickFormatter={fmtDia} minTickGap={24} />
                  <YAxis tickLine={false} axisLine={false} width={34} tick={AXIS_TICK} allowDecimals={false} />
                  <Tooltip contentStyle={TIP} labelFormatter={(d) => fmtDia(String(d))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="registros" name="Registros" stroke="var(--color-primary)" fill="url(#gradRegistros)" strokeWidth={2} />
                  <Area type="monotone" dataKey="aprobados" name="Aprobados" stroke="#10b981" fill="url(#gradAprobados)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Embudo de conversión</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {embudo.map((e) => (
              <BarraHorizontal key={e.key} label={e.label} value={e.value} max={maxEmbudo} color={COLOR_ESTADO[e.key === 'pendiente' ? 'pendiente_backoffice' : e.key]} />
            ))}
            <div className="flex justify-between border-t pt-3 text-sm">
              <span className="text-muted-foreground">Rechazados</span>
              <span className="font-medium tabular-nums text-red-600 dark:text-red-400">{num(data.por_estado.rechazado_backoffice)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DonutCard
          title="Por estado"
          icon={ClipboardList}
          data={Object.entries(data.por_estado).map(([key, value]) => ({ key, value }))}
          colorFn={(k) => COLOR_ESTADO[k] ?? '#94a3b8'}
          labelFn={(k) => ESTADO_CLIENTE_LABEL[k] ?? k}
        />
        <DonutCard
          title="Origen de venta"
          icon={Users}
          data={data.por_origen.map((o) => ({ key: o.origen_venta, value: o.total }))}
          colorFn={(_k, i) => PALETA[i % PALETA.length]}
          labelFn={(k) => ORIGEN_VENTA_LABEL[k] ?? k}
        />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ranking por agente</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {data.por_agente.length === 0 ? (
            <EmptyState icon={Users} title="Sin datos" />
          ) : (
            <>
              <div className="space-y-3">
                {data.por_agente.slice(0, 8).map((a) => (
                  <BarraHorizontal key={a.agente_id ?? a.agente_nombre} label={a.agente_nombre} value={a.total} max={maxAgente} color="var(--color-primary)" />
                ))}
              </div>
              <div className="overflow-x-auto border-t pt-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2 font-medium">Agente</th>
                      <th className="px-2 py-2 text-right font-medium">Registros</th>
                      <th className="px-2 py-2 text-right font-medium">Aprobados</th>
                      <th className="px-2 py-2 text-right font-medium">% aprobación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.por_agente.map((a) => (
                      <tr key={a.agente_id ?? a.agente_nombre} className="border-t">
                        <td className="px-2 py-2">{a.agente_nombre}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{a.total}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{a.aprobados}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{pct(a.total ? a.aprobados / a.total : null)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {esAdmin && data.por_empresa.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Vital vs. Vital Asiste</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.por_empresa.map((e) => ({ empresa: e.empresa_nombre, Registros: e.total, Aprobados: e.aprobados }))} margin={{ left: 4, right: 12, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="empresa" tickLine={false} axisLine={false} tick={AXIS_TICK} />
                <YAxis tickLine={false} axisLine={false} width={34} tick={AXIS_TICK} allowDecimals={false} />
                <Tooltip contentStyle={TIP} cursor={{ fill: 'var(--color-muted)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Registros" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Aprobados" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Aseguradoras más cotizadas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.aseguradoras.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Sin planes cotizados" className="border-none p-4" />
            ) : (
              data.aseguradoras.map((a, i) => (
                <BarraHorizontal key={a.aseguradora} label={a.aseguradora} value={a.total} max={maxAseguradora} color={PALETA[i % PALETA.length]} />
              ))
            )}
          </CardContent>
        </Card>

        <DonutCard
          title="Estado de la carta CMS"
          icon={CheckCircle2}
          data={data.firmas.map((f) => ({ key: f.estado, value: f.total }))}
          colorFn={(k) => COLOR_FIRMA[k] ?? '#94a3b8'}
          labelFn={(k) => ESTADO_FIRMA_LABEL[k] ?? k}
        />
      </div>
      {totalFirmas === 0 && <p className="-mt-2 text-xs text-muted-foreground">Sin cartas CMS enviadas todavía en este rango.</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Headphones className="size-4" /> Postventa — tipos de caso más frecuentes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.postventa.por_tipo.length === 0 ? (
              <EmptyState icon={Headphones} title="Sin casos de postventa" className="border-none p-4" />
            ) : (
              data.postventa.por_tipo.slice(0, 8).map((t, i) => (
                <BarraHorizontal
                  key={t.tipo_caso}
                  label={TIPO_CASO_POSTVENTA_LABEL[t.tipo_caso] ?? t.tipo_caso}
                  value={t.total}
                  max={maxTipoCaso}
                  color={PALETA[i % PALETA.length]}
                />
              ))
            )}
          </CardContent>
        </Card>

        <DonutCard
          title="Postventa — por estado"
          icon={Headphones}
          data={data.postventa.por_estado.map((e) => ({ key: e.estado, value: e.total }))}
          colorFn={(k) => COLOR_ESTADO_CASO[k] ?? '#94a3b8'}
          labelFn={(k) => ESTADO_CASO_POSTVENTA_LABEL[k] ?? k}
        />
      </div>
    </div>
  )
}
