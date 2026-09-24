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
import { useCasosPostventa } from '@/hooks/casosPostventa'
import { TIPO_CASO_POSTVENTA, TIPO_CASO_POSTVENTA_LABEL, ESTADO_CASO_POSTVENTA_LABEL, ESTADO_CASO_POSTVENTA_COLOR, TIPO_GESTION_POSTVENTA, TIPO_GESTION_POSTVENTA_LABEL, TIPO_GESTION_POSTVENTA_COLOR } from '@/lib/casosPostventaConstants'
import { fmtDateTime } from '@/lib/dateFormat'
import type { EstadoCasoPostventa } from '@/lib/types'

const ROL_GESTION_LABEL: Record<string, string> = { agente: 'Agente', backoffice: 'BackOffice' }
const ROL_GESTION_COLOR: Record<string, string> = {
  agente: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  backoffice: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
}

/** Tabla compartida por las colas de postventa: "Casos por gestionar" y
 * "Casos gestionados" del agente (pestaña Postventa), "Postventa" de
 * BackOffice, y la vista consolidada de admin — mismo patrón que
 * ClientesEstadoTable.tsx, pero de casos_postventa en vez de clientes.
 * `estadosBase` es el universo que le corresponde a esa pantalla (fijo, no
 * elegible); `estadoOpciones`, si se manda, agrega un selector para acotar
 * DENTRO de ese universo (ej. "gestionados" junta cerrado +
 * escalado_backoffice — con esto el agente puede ver solo lo que escaló,
 * con su ID, en vez de los dos mezclados). BackOffice no lo necesita: su
 * cola ya viene forzada a un solo estado desde el backend.
 * `mostrarRolGestion` (solo admin) agrega la columna y el filtro de
 * "gestionado por Agente/BackOffice" — filtrado del lado del cliente, la
 * lista ya viene acotada a 200 filas del backend. */
export function CasosPostventaTable({
  estadosBase,
  estadoOpciones,
  mostrarRolGestion,
  title,
  description,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  detailBasePath = '/casos',
}: {
  estadosBase: EstadoCasoPostventa[]
  estadoOpciones?: { value: EstadoCasoPostventa; label: string }[]
  mostrarRolGestion?: boolean
  title: string
  description: string
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  detailBasePath?: string
}) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('all')
  const [tipoCaso, setTipoCaso] = useState('all')
  const [tipoGestion, setTipoGestion] = useState('all')
  const [rolGestion, setRolGestion] = useState('all')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const estados = estado === 'all' ? estadosBase : [estado]
  const { data: dataCompleta, isLoading } = useCasosPostventa({
    estados,
    q: q || undefined,
    tipo_caso: tipoCaso === 'all' ? undefined : tipoCaso,
    tipo_gestion: tipoGestion === 'all' ? undefined : tipoGestion,
    desde: desde || undefined,
    hasta: hasta || undefined,
  })
  const data = rolGestion === 'all' ? dataCompleta : dataCompleta?.filter((c) => c.gestionado_por_rol === rolGestion)

  const hayFiltros = !!q || estado !== 'all' || tipoCaso !== 'all' || tipoGestion !== 'all' || rolGestion !== 'all' || !!desde || !!hasta

  function limpiar() {
    setQ('')
    setEstado('all')
    setTipoCaso('all')
    setTipoGestion('all')
    setRolGestion('all')
    setDesde('')
    setHasta('')
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      <div className="flex flex-wrap items-end gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-9 w-56 pl-8" placeholder="Nombre, teléfono, número de caso..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {estadoOpciones && (
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="h-9 w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier estado</SelectItem>
              {estadoOpciones.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={tipoCaso} onValueChange={setTipoCaso}>
          <SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier tipo de caso</SelectItem>
            {TIPO_CASO_POSTVENTA.map((t) => <SelectItem key={t.valor} value={t.valor}>{t.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tipoGestion} onValueChange={setTipoGestion}>
          <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier gestión</SelectItem>
            {TIPO_GESTION_POSTVENTA.map((t) => <SelectItem key={t} value={t}>{TIPO_GESTION_POSTVENTA_LABEL[t]}</SelectItem>)}
          </SelectContent>
        </Select>
        {mostrarRolGestion && (
          <Select value={rolGestion} onValueChange={setRolGestion}>
            <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Agente o BackOffice</SelectItem>
              <SelectItem value="agente">Gestionado por Agente</SelectItem>
              <SelectItem value="backoffice">Gestionado por BackOffice</SelectItem>
            </SelectContent>
          </Select>
        )}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <Input type="date" lang="en-US" className="h-9 w-36" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input type="date" lang="en-US" className="h-9 w-36" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        {hayFiltros && (
          <Button variant="ghost" size="sm" className="h-9 self-end" onClick={limpiar}>
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
          description={hayFiltros ? 'Prueba con otra búsqueda, tipo de caso o rango de fechas.' : emptyDescription}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Caso</th>
                  <th className="px-4 py-2.5 font-medium">Cliente</th>
                  <th className="px-4 py-2.5 font-medium">Tipo de caso</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 font-medium">Gestión</th>
                  <th className="px-4 py-2.5 font-medium">Gestionado por</th>
                  <th className="px-4 py-2.5 font-medium">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`${detailBasePath}/${c.id}`)} className="cursor-pointer border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5"><CopyableId id={c.id} /></td>
                    <td className="px-4 py-2.5 font-medium">{c.nombres} {c.apellidos}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{TIPO_CASO_POSTVENTA_LABEL[c.tipo_caso] ?? c.tipo_caso}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ESTADO_CASO_POSTVENTA_COLOR[c.estado]}`}>
                        {ESTADO_CASO_POSTVENTA_LABEL[c.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {c.tipo_gestion && (
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${TIPO_GESTION_POSTVENTA_COLOR[c.tipo_gestion]}`}>
                          {TIPO_GESTION_POSTVENTA_LABEL[c.tipo_gestion]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {c.gestionado_por_nombre ?? '—'}
                      {mostrarRolGestion && c.gestionado_por_rol && (
                        <span className={`ml-1.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${ROL_GESTION_COLOR[c.gestionado_por_rol] ?? ''}`}>
                          {ROL_GESTION_LABEL[c.gestionado_por_rol] ?? c.gestionado_por_rol}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{fmtDateTime(c.updated_at)}</td>
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
