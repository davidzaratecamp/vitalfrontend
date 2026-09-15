import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '../FormField'
import { usePago, useSetPago } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'
import { METODO_PAGO, METODO_PAGO_LABEL, MESES_EXPIRACION, aniosExpiracion } from '@/lib/clienteConstants'

const empty = { metodo: 'tarjeta', ultimos_4_digitos: '', nombre_titular_tarjeta: '', fecha_expiracion_mes: '', fecha_expiracion_ano: '' }
const anios = aniosExpiracion()

export function PagoStep({ clienteId, editable }: { clienteId: number; editable: boolean }) {
  const { data: pago, isLoading } = usePago(clienteId)
  const setPago = useSetPago(clienteId)
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (!pago) return
    setForm({
      metodo: pago.metodo,
      ultimos_4_digitos: pago.ultimos_4_digitos ?? '',
      nombre_titular_tarjeta: pago.nombre_titular_tarjeta ?? '',
      fecha_expiracion_mes: pago.fecha_expiracion_mes ? String(pago.fecha_expiracion_mes) : '',
      fecha_expiracion_ano: pago.fecha_expiracion_ano ? String(pago.fecha_expiracion_ano) : '',
    })
  }, [pago])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await setPago.mutateAsync({
        metodo: form.metodo,
        ultimos_4_digitos: form.ultimos_4_digitos || null,
        nombre_titular_tarjeta: form.nombre_titular_tarjeta || null,
        fecha_expiracion_mes: form.fecha_expiracion_mes ? Number(form.fecha_expiracion_mes) : null,
        fecha_expiracion_ano: form.fecha_expiracion_ano ? Number(form.fecha_expiracion_ano) : null,
      })
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
        Por seguridad, Vital nunca guarda el número completo de la tarjeta ni el CVV. Solo se
        registran los últimos 4 dígitos como referencia.
      </p>
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
        <FormField label="Últimos 4 dígitos">
          <Input
            value={form.ultimos_4_digitos}
            onChange={(e) => set('ultimos_4_digitos', e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="4242"
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
      {editable && (
        <Button type="submit" disabled={setPago.isPending}>{setPago.isPending ? 'Guardando...' : 'Guardar paso'}</Button>
      )}
    </form>
  )
}
