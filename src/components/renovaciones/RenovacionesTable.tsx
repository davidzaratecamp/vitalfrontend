import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Download, FileSpreadsheet, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { CopyableId } from '@/components/common/CopyableId'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRenovaciones, descargarRenovacionesExcel } from '@/hooks/renovaciones'
import { useAuthStore } from '@/stores/auth'
import { apiErrorMessage } from '@/lib/api'
import { ESTADO_CLIENTE_LABEL, ESTADO_CLIENTE_COLOR, RESULTADO_RENOVACION } from '@/lib/clienteConstants'
import { fmtDateTime, onChangeFechaFiltro } from '@/lib/dateFormat'

/**
 * Tabla compartida por todas las vistas de Renovaciones (agente, BackOffice,
 * admin y supervisor) — cada pantalla solo le pasa qué estados mostrar y a
 * dónde navegar. Mismo patrón que ClientesEstadoTable en ventas y
 * CasosPostventaTable en postventa.
 *
 * El ID es el de la venta original (una renovación no crea un registro
 * nuevo), así que se muestra igual de prominente: es como la busca todo el
 * mundo.
 */
export function RenovacionesTable({
  estados,
  title,
  description,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  rutaDetalle,
  mostrarEstado = true,
  filtroResultado = false,
}: {
  estados: string[]
  title: string
  description: string
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  /** Cómo armar el link de cada fila — cambia por rol (el agente va a su
   * formulario, BackOffice y admin a la pantalla de gestión). */
  rutaDetalle: (id: number) => string
  /** La columna Estado sobra cuando la pantalla ya filtra por uno solo. */
  mostrarEstado?: boolean
  /** Selector "Resultado" (renovadas / no renovadas / en proceso) — panel
   * de admin y supervisor (2026-11-03). Cuando está, manda sobre `estados`. */
  filtroResultado?: boolean
}) {
  const navigate = useNavigate()
  const role = useAuthStore((st) => st.user?.role)
  const [q, setQ] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [resultado, setResultado] = useState('todas')
  const estadosEfectivos = filtroResultado
    ? (RESULTADO_RENOVACION.find((r) => r.value === resultado)?.estados ?? estados)
    : estados
  const filtros = {
    estados: estadosEfectivos,
    q: q || undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
  }
  const { data, isLoading } = useRenovaciones(filtros)
  const [descargando, setDescargando] = useState(false)
  const hayFiltros = !!q || !!desde || !!hasta || resultado !== 'todas'
  // El agente solo ve lo suyo, así que la columna "Agente" no le dice nada.
  const mostrarAgente = role !== 'agente'
  // Mismos roles que exportan en Postventa — el agente no.
  const puedeExportar = role === 'admin' || role === 'supervisor' || role === 'backoffice'

  async function exportar() {
    setDescargando(true)
    try {
      await descargarRenovacionesExcel(filtros)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo exportar'))
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          puedeExportar ? (
            <Button variant="outline" onClick={exportar} disabled={descargando}>
              {descargando ? <FileSpreadsheet className="size-4 animate-pulse" /> : <Download className="size-4" />}
              {descargando ? 'Generando...' : 'Exportar Excel'}
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-end gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 w-56 pl-8"
            placeholder="Nombre, correo, SSN, teléfono, ID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {filtroResultado && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Resultado</label>
            <Select value={resultado} onValueChange={setResultado}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RESULTADO_RENOVACION.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" title="Pólizas que cambiaron de estado en este rango">Cambio de estado desde</label>
          <Input type="date" lang="en-US" className="h-9 w-36" value={desde} onChange={(e) => onChangeFechaFiltro(e.target.value, setDesde)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" title="Pólizas que cambiaron de estado en este rango">Cambio de estado hasta</label>
          <Input type="date" lang="en-US" className="h-9 w-36" value={hasta} onChange={(e) => onChangeFechaFiltro(e.target.value, setHasta)} />
        </div>
        {hayFiltros && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 self-end"
            onClick={() => {
              setQ('')
              setDesde('')
              setHasta('')
              setResultado('todas')
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
          description={hayFiltros ? 'Prueba con otro nombre o rango de fechas.' : emptyDescription}
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
                  {mostrarAgente && <th className="px-4 py-2.5 font-medium">Agente</th>}
                  {mostrarEstado && <th className="px-4 py-2.5 font-medium">Estado</th>}
                  <th className="px-4 py-2.5 font-medium">Temporada</th>
                  <th className="px-4 py-2.5 font-medium">Último cambio de estado</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(rutaDetalle(c.id))}
                    className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-2.5"><CopyableId id={c.id} /></td>
                    <td className="px-4 py-2.5 font-medium">{c.nombres} {c.apellidos}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.correo_electronico} · {c.phone_1}</td>
                    {mostrarAgente && <td className="px-4 py-2.5">{c.agente_nombre}</td>}
                    {mostrarEstado && (
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ESTADO_CLIENTE_COLOR[c.estado] ?? ''}`}>
                          {ESTADO_CLIENTE_LABEL[c.estado] ?? c.estado}
                        </span>
                        {c.estado === 'no_renovado' && c.motivo_no_renovado && (
                          <p className="mt-1 max-w-64 text-xs text-muted-foreground line-clamp-2" title={c.motivo_no_renovado}>
                            {c.motivo_no_renovado}
                          </p>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{c.renovacion_anio ?? '—'}</td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                      {c.ultimo_cambio_estado ? fmtDateTime(c.ultimo_cambio_estado) : <span className="italic">Sin cambios</span>}
                    </td>
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
