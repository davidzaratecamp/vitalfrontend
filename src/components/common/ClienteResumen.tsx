import { useEffect, useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FirmaCartaCard } from './FirmaCartaCard'
import { ObservacionesCard } from './ObservacionesCard'
import { abrirEvidencia, useDataPointCompleto, useNumeroTarjetaCompleto } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'
import { num } from '@/lib/analyticsFormat'
import { fmtDate } from '@/lib/dateFormat'
import { CATEGORIA_EVIDENCIA, CATEGORIA_EVIDENCIA_LABEL, METODO_PAGO_LABEL, EMPRESA_VITAL_ASISTE_ID } from '@/lib/clienteConstants'
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

/**
 * Backoffice solo ve clientes de su propia empresa (assertAccesoCliente en
 * el backend) — así que `user.empresa_id` alcanza para saber si ESTE
 * cliente es de Vital Asiste, sin tener que exponer la empresa del cliente
 * acá. Mismo criterio que assertPuedeVerNumeroTarjeta/
 * assertPuedeVerDataPoint en clientes.service.js (backend):
 * - Data Point: nunca estuvo abierto a nadie — hace falta el permiso
 *   individual siempre, en cualquier empresa (o ser admin).
 * - Número completo: en Vital Asiste hace falta el mismo permiso; en
 *   cualquier otra empresa (Vital, por ahora) sigue abierto sin él, como
 *   siempre.
 */
function usePuedeVerDataPoint() {
  const role = useAuthStore((s) => s.user?.role)
  const puedeVerDatosPago = useAuthStore((s) => s.user?.puede_ver_datos_pago)
  return role === 'admin' || !!puedeVerDatosPago
}

function usePuedeVerNumeroTarjeta() {
  const role = useAuthStore((s) => s.user?.role)
  const empresaId = useAuthStore((s) => s.user?.empresa_id)
  const puedeVerDatosPago = useAuthStore((s) => s.user?.puede_ver_datos_pago)
  if (role === 'admin') return true
  if (empresaId === EMPRESA_VITAL_ASISTE_ID) return !!puedeVerDatosPago
  return true
}

function NumeroTarjetaReveal({ clienteId }: { clienteId: number }) {
  const puedeVer = usePuedeVerNumeroTarjeta()
  const revelar = useNumeroTarjetaCompleto(clienteId)
  const [valor, setValor] = useState<{ numero: string; marca: string | null } | null>(null)

  useEffect(() => {
    if (!valor) return
    const t = setTimeout(() => setValor(null), OCULTAR_TRAS_MS)
    return () => clearTimeout(t)
  }, [valor])

  if (!puedeVer) return null

  async function toggle() {
    if (valor) return setValor(null)
    try {
      const data = await revelar.mutateAsync()
      if (!data?.numero_tarjeta) return toast.error('No hay una tarjeta guardada para este cliente')
      setValor({ numero: data.numero_tarjeta, marca: data.marca_tarjeta })
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo revelar el número completo'))
    }
  }

  return (
    <div className="flex items-center gap-2 pt-1">
      {valor && <span className="max-w-xs truncate font-mono text-sm">{valor.numero}{valor.marca ? ` · ${valor.marca}` : ''}</span>}
      <Button type="button" variant="outline" size="sm" onClick={toggle} disabled={revelar.isPending}>
        {valor ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {valor ? 'Ocultar' : 'Ver número completo'}
      </Button>
    </div>
  )
}

function DataPointReveal({ clienteId }: { clienteId: number }) {
  const puedeVer = usePuedeVerDataPoint()
  const revelar = useDataPointCompleto(clienteId)
  const [valor, setValor] = useState<string | null>(null)

  useEffect(() => {
    if (!valor) return
    const t = setTimeout(() => setValor(null), OCULTAR_TRAS_MS)
    return () => clearTimeout(t)
  }, [valor])

  if (!puedeVer) return null

  async function toggle() {
    if (valor) return setValor(null)
    try {
      const data = await revelar.mutateAsync()
      if (!data.data_point) return toast.error('No hay un Data Point guardado para este cliente')
      setValor(data.data_point)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo revelar el Data Point'))
    }
  }

  return (
    <div className="flex items-center gap-2 pt-1">
      {valor && <span className="max-w-xs truncate text-sm">{valor}</span>}
      <Button type="button" variant="outline" size="sm" onClick={toggle} disabled={revelar.isPending}>
        {valor ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {valor ? 'Ocultar' : 'Ver Data Point'}
      </Button>
    </div>
  )
}

export function ClienteResumen({ c }: { c: ClienteDetalle }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            Titular
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                c.solicita_cobertura
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {c.solicita_cobertura ? 'Enrolado en la póliza' : 'No enrolado'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <Row label="Nombre" value={`${c.nombres} ${c.apellidos}`} />
          <Row label="Sexo / nace" value={`${c.sexo} · ${fmtDate(c.fecha_nacimiento)}`} />
          <Row label="SSN" value={c.social} />
          <Row label="Estatus migratorio" value={c.estatus_migratorio} />
          <Row label="Dirección" value={`${c.direccion}, ${c.ciudad}, ${c.estado_us} ${c.codigo_postal}`} />
          <Row label="Condado" value={c.condado} />
          <Row label="Tipo de vivienda" value={c.tipo_vivienda} />
          <Row label="Correo" value={c.correo_electronico} />
          <Row label="Teléfono principal" value={c.phone_1} />
          {c.phone_2 && <Row label="Teléfono adicional" value={c.phone_2} />}
          {c.whatsapp && <Row label="WhatsApp" value={c.whatsapp} />}
          <Row label="Horario de contactabilidad" value={c.horario_contactabilidad} />
          <Row label="Origen de venta" value={c.origen_venta} />
          <Row label="Pregunta de seguridad" value={c.pregunta_seguridad} />
          <Row
            label="Respuesta de seguridad"
            value={
              c.respuesta_seguridad ??
              (c.pregunta_seguridad ? 'Guardada antes de este cambio — no se puede recuperar' : null)
            }
          />
          <Row label="Agente" value={c.agente?.name} />
        </CardContent>
        {(c.contacto_emergencia_nombre || c.contacto_emergencia_telefono || c.contacto_emergencia_email) && (
          <CardContent className="border-t pt-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Contacto de emergencia</p>
            <div className="divide-y">
              <Row label="Nombre" value={c.contacto_emergencia_nombre} />
              <Row label="Teléfono" value={c.contacto_emergencia_telefono} />
              <Row label="Correo" value={c.contacto_emergencia_email} />
            </div>
          </CardContent>
        )}
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Cónyuge y dependientes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {c.dependientes.length === 0 && <p className="text-sm text-muted-foreground">Sin cónyuge ni dependientes.</p>}
            {c.dependientes.map((d) => (
              <div key={d.id} className="rounded-md border p-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{d.nombres} {d.apellidos} <span className="font-normal text-muted-foreground">· {d.parentesco}</span></p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      d.solicita_cobertura
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {d.solicita_cobertura ? 'Enrolado en la póliza' : 'No enrolado'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {d.sexo} · nace {fmtDate(d.fecha_nacimiento)} · {d.estatus_migratorio}
                  {d.social && ` · SSN ${d.social}`}
                  {!!d.medicare_medicaid && ' · Medicare/Medicaid'}
                </p>
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
                value={`$${num(Number(i.ingresos_anuales))}/año (${i.tipo_declaracion})`}
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
              <Row label="Atención primaria (PD)" value={c.plan_salud.pd} />
              <Row label="Atención de especialista (SD)" value={c.plan_salud.sd} />
              <Row label="Medicamento genérico (GD)" value={c.plan_salud.gd} />
              <Row
                label="Productor (NPN)"
                value={
                  c.plan_salud.npn_productor_nombre
                    ? c.plan_salud.npn_productor_npn
                      ? `${c.plan_salud.npn_productor_nombre} (${c.plan_salud.npn_productor_npn})`
                      : `${c.plan_salud.npn_productor_nombre} — sin NPN cargado`
                    : null
                }
              />
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
            <Row label="Método de pago" value={c.pago ? METODO_PAGO_LABEL[c.pago.metodo] : null} />
            <Row
              label="Información de pago"
              value={
                c.pago?.ultimos_4_digitos ? (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Lock className="size-3.5" /> Encriptada
                  </span>
                ) : (
                  '—'
                )
              }
            />
          </div>
          {c.pago?.ultimos_4_digitos && <NumeroTarjetaReveal clienteId={c.id} />}
          {c.pago?.tiene_data_point && <DataPointReveal clienteId={c.id} />}
          <div className="space-y-3 border-t pt-3">
            {c.evidencias.length === 0 && <p className="text-sm text-muted-foreground">Sin evidencias.</p>}
            {CATEGORIA_EVIDENCIA.map((cat) => {
              const archivos = c.evidencias.filter((e) => e.categoria === cat)
              if (!archivos.length) return null
              return (
                <div key={cat} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{CATEGORIA_EVIDENCIA_LABEL[cat]}</p>
                  {archivos.map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{e.nombre_archivo}</span>
                      <Button variant="ghost" size="icon" onClick={() => verEvidencia(e.id, e.nombre_archivo)}>
                        <Eye className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )
            })}
            {c.evidencias.some((e) => !e.categoria) && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Sin categoría</p>
                {c.evidencias.filter((e) => !e.categoria).map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{e.nombre_archivo}</span>
                    <Button variant="ghost" size="icon" onClick={() => verEvidencia(e.id, e.nombre_archivo)}>
                      <Eye className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ObservacionesCard clienteId={c.id} observaciones={c.observaciones} />

      <FirmaCartaCard clienteId={c.id} correoCliente={c.correo_electronico} telefonoCliente={c.phone_1} whatsappCliente={c.whatsapp} />
    </div>
  )
}
