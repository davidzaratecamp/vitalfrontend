import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CardBrandLogo } from './CardBrandLogo'
import { FirmaCartaCard } from './FirmaCartaCard'
import { abrirEvidencia, useNumeroTarjetaCompleto } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'
import { formatearTarjeta } from '@/lib/card'
import { num } from '@/lib/analyticsFormat'
import { fmtDate } from '@/lib/dateFormat'
import { useAuthStore } from '@/stores/auth'
import type { ClienteDetalle } from '@/lib/types'

// Se oculta sola a los 20s — no se queda en pantalla indefinidamente
// después de revelarla.
const OCULTAR_TRAS_MS = 20_000

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right">{value ?? '—'}</span>
    </div>
  )
}

async function verEvidencia(id: number, nombreArchivo: string) {
  try {
    await abrirEvidencia(id, nombreArchivo)
  } catch (err) {
    toast.error(apiErrorMessage(err, 'No se pudo abrir el archivo'))
  }
}

function NumeroTarjetaReveal({ clienteId }: { clienteId: number }) {
  const role = useAuthStore((s) => s.user?.role)
  const revelar = useNumeroTarjetaCompleto(clienteId)
  const [numero, setNumero] = useState<string | null>(null)

  useEffect(() => {
    if (!numero) return
    const t = setTimeout(() => setNumero(null), OCULTAR_TRAS_MS)
    return () => clearTimeout(t)
  }, [numero])

  if (role !== 'backoffice' && role !== 'admin') return null

  async function toggle() {
    if (numero) return setNumero(null)
    try {
      const data = await revelar.mutateAsync()
      if (!data) return toast.error('No hay una tarjeta guardada para este cliente')
      setNumero(data.numero_tarjeta)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo revelar el número'))
    }
  }

  return (
    <div className="flex items-center gap-2 pt-1">
      {numero && <span className="font-mono text-sm tabular-nums">{formatearTarjeta(numero)}</span>}
      <Button type="button" variant="outline" size="sm" onClick={toggle} disabled={revelar.isPending}>
        {numero ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {numero ? 'Ocultar' : 'Ver número completo'}
      </Button>
    </div>
  )
}

export function ClienteResumen({ c }: { c: ClienteDetalle }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Titular</CardTitle></CardHeader>
        <CardContent className="divide-y">
          <Row label="Nombre" value={`${c.nombres} ${c.apellidos}`} />
          <Row label="Sexo / nace" value={`${c.sexo} · ${fmtDate(c.fecha_nacimiento)}`} />
          <Row label="SSN" value={c.social} />
          <Row label="Estatus migratorio" value={c.estatus_migratorio} />
          <Row label="Dirección" value={`${c.direccion}, ${c.ciudad}, ${c.estado_us} ${c.codigo_postal}`} />
          <Row label="Condado" value={c.condado} />
          <Row label="Correo" value={c.correo_electronico} />
          <Row label="Teléfonos" value={[c.phone_1, c.phone_2, c.whatsapp].filter(Boolean).join(' · ')} />
          <Row label="Origen de venta" value={c.origen_venta} />
          <Row label="Agente" value={c.agente?.name} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Cónyuge y dependientes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {c.dependientes.length === 0 && <p className="text-sm text-muted-foreground">Sin cónyuge ni dependientes.</p>}
            {c.dependientes.map((d) => (
              <div key={d.id} className="rounded-md border p-2.5 text-sm">
                <p className="font-medium">{d.nombres} {d.apellidos} <span className="font-normal text-muted-foreground">· {d.parentesco}</span></p>
                <p className="text-xs text-muted-foreground">{d.sexo} · nace {fmtDate(d.fecha_nacimiento)} · {d.estatus_migratorio}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Ingresos</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {c.ingresos.map((i) => (
              <Row
                key={i.id}
                label={i.dependiente_id == null ? 'Titular' : `Dependiente #${i.dependiente_id}`}
                value={`$${num(Number(i.ingresos_semanales))}/sem · $${num(Number(i.ingresos_anuales))}/año (${i.tipo_declaracion})`}
              />
            ))}
            <Row label="Total familia (anual)" value={`$${num(c.ingresos_totales_familia)}`} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Plan de salud cotizado</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {c.plan_salud ? (
            <>
              <Row label="Aseguradora" value={c.plan_salud.aseguradora_nombre} />
              <Row label="Plan" value={c.plan_salud.nombre_plan} />
              <Row label="Tipo" value={`${c.plan_salud.tipo_metal} · ${c.plan_salud.tipo_red}`} />
              <Row label="Deducible" value={c.plan_salud.deducible ? `$${num(Number(c.plan_salud.deducible))}` : '—'} />
              <Row label="Gasto máx. bolsillo" value={c.plan_salud.gasto_max_bolsillo ? `$${num(Number(c.plan_salud.gasto_max_bolsillo))}` : '—'} />
              <Row label="Prima" value={`$${num(Number(c.plan_salud.valor_prima))}`} />
              <Row label="Taxes" value={c.plan_salud.taxes ? `$${num(Number(c.plan_salud.taxes))}` : '—'} />
              <Row label="Atención primaria (PD)" value={c.plan_salud.pd} />
              <Row label="Atención de especialista (SD)" value={c.plan_salud.sd} />
              <Row label="Medicamento genérico (GD)" value={c.plan_salud.gd} />
              <Row label="Productor (NPN)" value={c.plan_salud.npn_productor_nombre} />
              <Row label="NPN" value={c.plan_salud.npn} />
              <Row label="Estado de la prima" value={c.plan_salud.estado_prima} />
              <Row label="Origen" value={c.plan_salud.version_origen === 'confirmado_backoffice' ? 'Confirmado por BackOffice' : 'Cotizado por el agente'} />
            </>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">Sin plan cotizado.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Pago y evidencias</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="divide-y">
            <Row label="Método" value={c.pago?.metodo} />
            <Row
              label="Tarjeta"
              value={
                c.pago?.ultimos_4_digitos ? (
                  <span className="inline-flex items-center gap-1.5">
                    {c.pago.marca_tarjeta && <CardBrandLogo marca={c.pago.marca_tarjeta} className="h-4 w-auto" />}
                    **** {c.pago.ultimos_4_digitos}
                  </span>
                ) : (
                  '—'
                )
              }
            />
            <Row
              label="Vence"
              value={c.pago?.fecha_expiracion_mes ? `${String(c.pago.fecha_expiracion_mes).padStart(2, '0')}/${c.pago.fecha_expiracion_ano}` : '—'}
            />
          </div>
          {c.pago?.ultimos_4_digitos && <NumeroTarjetaReveal clienteId={c.id} />}
          <div className="space-y-1.5 border-t pt-3">
            {c.evidencias.length === 0 && <p className="text-sm text-muted-foreground">Sin evidencias.</p>}
            {c.evidencias.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{e.nombre_archivo}</span>
                <Button variant="ghost" size="icon" onClick={() => verEvidencia(e.id, e.nombre_archivo)}>
                  <Eye className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <FirmaCartaCard clienteId={c.id} correoCliente={c.correo_electronico} />
    </div>
  )
}
