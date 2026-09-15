import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CheckCircle2, ClipboardList, TrendingUp, Users } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useDashboard } from '@/hooks/admin'
import { pct, num } from '@/lib/analyticsFormat'
import { ESTADO_CLIENTE_LABEL } from '@/lib/clienteConstants'

const TIP = { background: 'var(--color-popover)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }

export default function DashboardPage() {
  const { data, isLoading } = useDashboard()

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Panel general" description="Vista consolidada de todos los registros del CRM." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Registros totales" value={num(data.total)} icon={ClipboardList} />
        <KpiCard label="Aprobados" value={num(data.por_estado.aprobado)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Pendientes BackOffice" value={num(data.por_estado.pendiente_backoffice)} icon={Users} tone="warning" />
        <KpiCard label="Tasa de aprobación" value={pct(data.tasa_aprobacion)} icon={TrendingUp} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Registros por día</CardTitle></CardHeader>
          <CardContent>
            {data.tendencia.length === 0 ? (
              <EmptyState icon={TrendingUp} title="Sin registros en el rango" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.tendencia} margin={{ left: 4, right: 12, top: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="dia" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickFormatter={(d: string) => d.slice(5).replace('-', '/')} minTickGap={24} />
                  <YAxis tickLine={false} axisLine={false} width={34} tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} />
                  <Tooltip contentStyle={TIP} cursor={{ fill: 'var(--color-muted)' }} />
                  <Bar dataKey="calls" name="Registros" fill="var(--color-primary)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Por estado</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {Object.entries(data.por_estado).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{ESTADO_CLIENTE_LABEL[k] ?? k}</span>
                <span className="font-medium tabular-nums">{num(v)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ranking por agente</CardTitle></CardHeader>
        <CardContent className="p-0">
          {data.por_agente.length === 0 ? (
            <div className="p-6"><EmptyState icon={Users} title="Sin datos" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Agente</th>
                    <th className="px-4 py-2.5 text-right font-medium">Registros</th>
                    <th className="px-4 py-2.5 text-right font-medium">Aprobados</th>
                    <th className="px-4 py-2.5 text-right font-medium">% aprobación</th>
                  </tr>
                </thead>
                <tbody>
                  {data.por_agente.map((a) => (
                    <tr key={a.agente_id ?? a.agente_nombre} className="border-b last:border-0">
                      <td className="px-4 py-2">{a.agente_nombre}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{a.total}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{a.aprobados}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{pct(a.total ? a.aprobados / a.total : null)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
