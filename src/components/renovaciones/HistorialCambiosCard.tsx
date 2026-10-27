import { History } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCambiosCliente } from '@/hooks/renovaciones'
import { SECCION_CAMBIO_LABEL } from '@/lib/clienteConstants'
import { FIELD_LABELS } from '@/lib/fieldLabels'
import { fmtDateTime } from '@/lib/dateFormat'
import type { CambioCliente } from '@/lib/types'

const CONTEXTO_LABEL: Record<string, string> = {
  venta: 'Venta',
  renovacion: 'Renovación',
  postventa: 'Postventa',
}

const CONTEXTO_COLOR: Record<string, string> = {
  venta: 'bg-secondary text-secondary-foreground',
  renovacion: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  postventa: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
}

/** '—' en vez de un hueco: un campo que estaba vacío y se llenó es un
 * cambio tan real como cualquier otro, y tiene que leerse. */
function Valor({ texto, tachado }: { texto: string | null; tachado?: boolean }) {
  if (texto === null || texto === '') return <span className="text-muted-foreground">(vacío)</span>
  return <span className={tachado ? 'text-muted-foreground line-through' : 'font-medium'}>{texto}</span>
}

function Fila({ c }: { c: CambioCliente }) {
  const seccion = SECCION_CAMBIO_LABEL[c.seccion] ?? c.seccion
  const alta = c.campo === '__alta__'
  const baja = c.campo === '__baja__'

  return (
    <li className="border-b px-4 py-2.5 last:border-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${CONTEXTO_COLOR[c.contexto] ?? ''}`}>
          {CONTEXTO_LABEL[c.contexto] ?? c.contexto}
        </span>
        <span className="text-muted-foreground">{seccion}</span>
        {alta || baja ? (
          <span>
            <span className="font-medium">{alta ? 'Se agregó' : 'Se eliminó'}:</span>{' '}
            {alta ? c.valor_nuevo : c.valor_anterior}
          </span>
        ) : (
          <>
            <span className="font-medium">{FIELD_LABELS[c.campo] ?? c.campo}</span>
            <span className="text-muted-foreground">:</span>
            <Valor texto={c.valor_anterior} tachado />
            <span className="text-muted-foreground">→</span>
            <Valor texto={c.valor_nuevo} />
          </>
        )}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {c.cambiado_por_nombre ?? 'Sistema'} · {fmtDateTime(c.created_at)}
      </p>
    </li>
  )
}

/**
 * Qué se tocó del formulario, con el valor de antes y el de después
 * (`historial_cambios_cliente`). Nació con las renovaciones —"debe quedar
 * el historial de que se cambió"— pero muestra todo el recorrido del
 * registro: una corrección de la venta, un ajuste de postventa y un cambio
 * de renovación se distinguen por la etiqueta de contexto.
 *
 * Los datos sensibles (número de tarjeta, cuenta, Data Point, respuesta de
 * seguridad) aparecen como cambiados pero SIN valores — nunca se guardan en
 * texto plano en el historial.
 */
export function HistorialCambiosCard({
  clienteId,
  contexto,
  titulo = 'Historial de cambios',
}: {
  clienteId: number | undefined
  /** 'renovacion' para ver solo lo que se cambió renovando. */
  contexto?: string
  titulo?: string
}) {
  const { data, isLoading } = useCambiosCliente(clienteId, contexto)

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <History className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">{titulo}</p>
        {!!data?.length && <span className="text-xs text-muted-foreground">({data.length})</span>}
      </div>
      {isLoading ? (
        <Skeleton className="m-4 h-24 rounded-lg" />
      ) : !data?.length ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          Todavía no se ha modificado ningún dato{contexto === 'renovacion' ? ' en esta renovación' : ''}.
        </p>
      ) : (
        <ul className="max-h-[420px] overflow-y-auto">
          {data.map((c) => <Fila key={c.id} c={c} />)}
        </ul>
      )}
    </Card>
  )
}
