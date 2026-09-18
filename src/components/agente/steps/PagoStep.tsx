import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '../FormField'
import { CardPreview } from '@/components/common/CardPreview'
import { usePago, useSetPago } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'
import { detectarMarcaTarjeta, formatearTarjeta } from '@/lib/card'
import { METODO_PAGO, METODO_PAGO_LABEL, MESES_EXPIRACION, aniosExpiracion } from '@/lib/clienteConstants'

const empty = { metodo: 'tarjeta', nombre_titular_tarjeta: '', fecha_expiracion_mes: '', fecha_expiracion_ano: '' }
const anios = aniosExpiracion()

// Bloquea copiar/pegar/cortar en el campo de la tarjeta — no queremos que
// el número salga de ahí por otro camino que no sea guardarlo cifrado.
const sinPortapapeles = (e: React.ClipboardEvent) => e.preventDefault()

export function PagoStep({ clienteId, editable }: { clienteId: number; editable: boolean }) {
  const { data: pago, isLoading } = usePago(clienteId)
  const setPago = useSetPago(clienteId)
  const [form, setForm] = useState(empty)
  // Aparte del resto del form: nunca llega prellenado (el backend no lo
  // vuelve a exponer) — vacío significa "no cambiar la tarjeta guardada".
  const [numeroTarjeta, setNumeroTarjeta] = useState('')
  // Mismo trato que el número de tarjeta: el agente lo escribe pero no lo
  // vuelve a ver, ni siquiera él — vacío significa "no cambiar el Data
  // Point guardado".
  const [dataPoint, setDataPoint] = useState('')

  useEffect(() => {
    if (!pago) return
    setForm({
      metodo: pago.metodo,
      nombre_titular_tarjeta: pago.nombre_titular_tarjeta ?? '',
      fecha_expiracion_mes: pago.fecha_expiracion_mes ? String(pago.fecha_expiracion_mes) : '',
      fecha_expiracion_ano: pago.fecha_expiracion_ano ? String(pago.fecha_expiracion_ano) : '',
    })
  }, [pago])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const marcaEnVivo = numeroTarjeta ? detectarMarcaTarjeta(numeroTarjeta) : pago?.marca_tarjeta ?? null
  const ultimos4EnVivo = numeroTarjeta ? numeroTarjeta.slice(-4) : pago?.ultimos_4_digitos ?? ''

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (numeroTarjeta && numeroTarjeta.length < 13) {
      toast.error('El número de tarjeta debe tener al menos 13 dígitos')
      return
    }
    try {
      await setPago.mutateAsync({
        metodo: form.metodo,
        numero_tarjeta: numeroTarjeta || undefined,
        nombre_titular_tarjeta: form.nombre_titular_tarjeta || null,
        fecha_expiracion_mes: form.fecha_expiracion_mes ? Number(form.fecha_expiracion_mes) : null,
        fecha_expiracion_ano: form.fecha_expiracion_ano ? Number(form.fecha_expiracion_ano) : null,
        data_point: dataPoint || undefined,
      })
      setNumeroTarjeta('')
      setDataPoint('')
      toast.success('Información de pago guardada')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo guardar'))
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando...</p>

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="flex items-start gap-2 rounded-md bg-accent-soft/60 bg-accent/10 px-3 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-accent" />
        El número queda cifrado — nadie lo vuelve a ver en texto plano acá, ni siquiera tú una vez guardado. Solo BackOffice y Admin pueden revelarlo completo, y cada vez que lo hacen queda registrado.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Método de pago" required>
            <Select value={form.metodo} onValueChange={(v) => set('metodo', v)} disabled={!editable}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{METODO_PAGO.map((m) => <SelectItem key={m} value={m}>{METODO_PAGO_LABEL[m]}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Nombre del titular de la tarjeta">
            <Input value={form.nombre_titular_tarjeta} onChange={(e) => set('nombre_titular_tarjeta', e.target.value)} disabled={!editable} />
          </FormField>
          <FormField
            label="Número de tarjeta"
            hint={pago?.ultimos_4_digitos ? `Ya hay una guardada terminada en ${pago.ultimos_4_digitos} — déjalo en blanco para no cambiarla.` : undefined}
          >
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={formatearTarjeta(numeroTarjeta)}
              onChange={(e) => setNumeroTarjeta(e.target.value.replace(/\D/g, '').slice(0, 19))}
              onPaste={sinPortapapeles}
              onCopy={sinPortapapeles}
              onCut={sinPortapapeles}
              onContextMenu={(e) => e.preventDefault()}
              placeholder="•••• •••• •••• ••••"
              disabled={!editable}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Mes vence">
              <Select value={form.fecha_expiracion_mes} onValueChange={(v) => set('fecha_expiracion_mes', v)} disabled={!editable}>
                <SelectTrigger><SelectValue placeholder="MM" /></SelectTrigger>
                <SelectContent>{MESES_EXPIRACION.map((m) => <SelectItem key={m} value={String(m)}>{String(m).padStart(2, '0')}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Año vence">
              <Select value={form.fecha_expiracion_ano} onValueChange={(v) => set('fecha_expiracion_ano', v)} disabled={!editable}>
                <SelectTrigger><SelectValue placeholder="AAAA" /></SelectTrigger>
                <SelectContent>{anios.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <CardPreview
            ultimos4={ultimos4EnVivo}
            marca={marcaEnVivo}
            nombreTitular={form.nombre_titular_tarjeta}
            mes={form.fecha_expiracion_mes ? Number(form.fecha_expiracion_mes) : null}
            ano={form.fecha_expiracion_ano ? Number(form.fecha_expiracion_ano) : null}
          />
        </div>
      </div>

      <FormField
        label="Data Point"
        hint={pago?.tiene_data_point ? 'Ya hay uno guardado — déjalo en blanco para no cambiarlo.' : 'Solo BackOffice y Admin pueden verlo — ni tú, una vez guardado.'}
      >
        <Input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={dataPoint}
          onChange={(e) => setDataPoint(e.target.value.slice(0, 300))}
          onPaste={sinPortapapeles}
          onCopy={sinPortapapeles}
          onCut={sinPortapapeles}
          onContextMenu={(e) => e.preventDefault()}
          placeholder="••••••••••"
          disabled={!editable}
        />
      </FormField>

      {editable && (
        <Button type="submit" disabled={setPago.isPending}>{setPago.isPending ? 'Guardando...' : 'Guardar paso'}</Button>
      )}
    </form>
  )
}
