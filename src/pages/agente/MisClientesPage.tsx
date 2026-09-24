import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FilePlus2, Search, Users, ClipboardList, Undo2, CheckCircle2, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CopyableId } from '@/components/common/CopyableId'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { useClientes, useEliminarCliente } from '@/hooks/clientes'
import { useResumenAgente } from '@/hooks/agente'
import { apiErrorMessage } from '@/lib/api'
import { ESTADO_CLIENTE_LABEL, ESTADO_CLIENTE_COLOR } from '@/lib/clienteConstants'
import { num } from '@/lib/analyticsFormat'
import { fmtDate } from '@/lib/dateFormat'

export default function MisClientesPage() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState('all')
  const [q, setQ] = useState('')
  const { data, isLoading } = useClientes({ estado: estado === 'all' ? undefined : estado, q: q || undefined })
  const { data: resumen, isLoading: cargandoResumen } = useResumenAgente()
  const eliminar = useEliminarCliente()
  const [porBorrar, setPorBorrar] = useState<{ id: number; nombre: string } | null>(null)

  async function confirmarBorrado() {
    if (!porBorrar) return
    try {
      await eliminar.mutateAsync(porBorrar.id)
      toast.success('Borrador eliminado')
      setPorBorrar(null)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo eliminar'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis clientes"
        description="Los registros que has creado, en cualquier estado."
        actions={
          <Button onClick={() => navigate('/nuevo')}>
            <FilePlus2 className="size-4" /> Nuevo registro
          </Button>
        }
      />

      {cargandoResumen || !resumen ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="En borrador" value={num(resumen.por_estado.borrador)} hint="Sin enviar todavía" icon={ClipboardList} />
          <KpiCard label="Pendientes BackOffice" value={num(resumen.por_estado.pendiente_backoffice)} icon={Users} tone="warning" />
          <KpiCard label="Aprobados" value={num(resumen.por_estado.aprobado)} hint={`${num(resumen.aprobados_mes)} este mes`} icon={CheckCircle2} tone="success" />
          <KpiCard label="Rechazados sin corregir" value={num(resumen.por_estado.rechazado_backoffice)} icon={Undo2} tone="danger" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-9 w-56 pl-8" placeholder="Nombre, correo, SSN, ID..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier estado</SelectItem>
            {Object.entries(ESTADO_CLIENTE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : !data?.length ? (
        <EmptyState icon={Users} title="Sin clientes todavía" description="Crea tu primer registro con 'Nuevo registro'." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">ID</th>
                  <th className="px-4 py-2.5 font-medium">Cliente</th>
                  <th className="px-4 py-2.5 font-medium">Contacto</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 font-medium">Creado</th>
                  <th className="px-4 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/clientes/${c.id}/editar`)}
                    className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-2.5"><CopyableId id={c.id} /></td>
                    <td className="px-4 py-2.5 font-medium">{c.nombres} {c.apellidos}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.correo_electronico} · {c.phone_1}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${ESTADO_CLIENTE_COLOR[c.estado]}`}>
                        {ESTADO_CLIENTE_LABEL[c.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{fmtDate(c.created_at)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {c.estado === 'borrador' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Eliminar borrador"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPorBorrar({ id: c.id, nombre: `${c.nombres} ${c.apellidos}` })
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!porBorrar}
        onOpenChange={(v) => !v && setPorBorrar(null)}
        title="¿Eliminar este borrador?"
        description={`Se va a borrar "${porBorrar?.nombre}" por completo, con todo lo que se haya guardado (dependientes, evidencias, etc). No se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        loading={eliminar.isPending}
        onConfirm={confirmarBorrado}
      />
    </div>
  )
}
