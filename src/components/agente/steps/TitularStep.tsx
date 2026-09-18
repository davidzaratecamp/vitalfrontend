import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { TriangleAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '../FormField'
import { LocationSelector } from '../LocationSelector'
import { useCrearCliente, useActualizarTitular, useVerificarDuplicado } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'
import { SEXO, ESTATUS_MIGRATORIO, ORIGEN_VENTA, ORIGEN_VENTA_LABEL, ESTADO_CLIENTE_LABEL } from '@/lib/clienteConstants'
import type { Cliente } from '@/lib/types'

const empty = {
  solicita_cobertura: false,
  nombres: '',
  apellidos: '',
  sexo: '',
  fecha_nacimiento: '',
  social: '',
  estatus_migratorio: '',
  direccion: '',
  tipo_vivienda: '',
  estado_us: '',
  condado: '',
  ciudad: '',
  codigo_postal: '',
  correo_electronico: '',
  phone_1: '',
  phone_2: '',
  whatsapp: '',
  contacto_emergencia_nombre: '',
  contacto_emergencia_telefono: '',
  contacto_emergencia_email: '',
  origen_venta: '',
  pregunta_seguridad: '',
  respuesta_seguridad: '',
}

function edadDe(fecha: string): number | null {
  if (!fecha) return null
  const nac = new Date(fecha + 'T00:00:00')
  if (Number.isNaN(nac.getTime())) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

export function TitularStep({
  cliente,
  editable,
  prellenar,
  onCreated,
  onEstadoChange,
}: {
  cliente?: Cliente
  editable: boolean
  /** Teléfono que el agente ya validó en la compuerta de "Nuevo registro" — se usa tal cual, no hay que volver a escribirlo. */
  prellenar?: { phone_1: string }
  onCreated?: (id: number) => void
  /** El Paso 5 necesita el estado apenas se elige acá, antes incluso de
   * guardar este paso — así puede mostrar qué aseguradoras ofrecer "desde
   * el minuto 1". */
  onEstadoChange?: (estado: string) => void
}) {
  const [form, setForm] = useState(() => (prellenar ? { ...empty, ...prellenar } : empty))
  const crear = useCrearCliente()
  const actualizar = useActualizarTitular(cliente?.id ?? 0)
  const busy = crear.isPending || actualizar.isPending

  useEffect(() => {
    onEstadoChange?.(form.estado_us)
  }, [form.estado_us, onEstadoChange])

  useEffect(() => {
    if (!cliente) return
    setForm({
      solicita_cobertura: cliente.solicita_cobertura,
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      sexo: cliente.sexo,
      fecha_nacimiento: cliente.fecha_nacimiento?.slice(0, 10) ?? '',
      social: cliente.social,
      estatus_migratorio: cliente.estatus_migratorio,
      direccion: cliente.direccion,
      tipo_vivienda: cliente.tipo_vivienda ?? '',
      estado_us: cliente.estado_us,
      condado: cliente.condado,
      ciudad: cliente.ciudad,
      codigo_postal: cliente.codigo_postal,
      correo_electronico: cliente.correo_electronico,
      phone_1: cliente.phone_1,
      phone_2: cliente.phone_2 ?? '',
      whatsapp: cliente.whatsapp ?? '',
      contacto_emergencia_nombre: cliente.contacto_emergencia_nombre ?? '',
      contacto_emergencia_telefono: cliente.contacto_emergencia_telefono ?? '',
      contacto_emergencia_email: cliente.contacto_emergencia_email ?? '',
      origen_venta: cliente.origen_venta,
      pregunta_seguridad: cliente.pregunta_seguridad ?? '',
      respuesta_seguridad: '',
    })
  }, [cliente])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))
  const edad = edadDe(form.fecha_nacimiento)

  // Aviso de posible duplicado (mismo SSN o correo) — solo tiene sentido al
  // crear un cliente nuevo, con lo que el agente ya terminó de escribir.
  const [debSocial, setDebSocial] = useState('')
  const [debCorreo, setDebCorreo] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      setDebSocial(form.social)
      setDebCorreo(form.correo_electronico)
    }, 500)
    return () => clearTimeout(t)
  }, [form.social, form.correo_electronico])
  // `crear.isIdle` se apaga apenas se intenta crear (pending o success) y
  // nunca se vuelve a prender en esta misma sesión del formulario — evita
  // una carrera: justo después de crear, mientras la página todavía está
  // navegando hacia el modo edición, `cliente` sigue sin llegar por un
  // instante y el chequeo se repetía con el SSN/correo que se acaba de
  // guardar — encontrando el registro recién creado y marcándolo como
  // "duplicado" de sí mismo.
  const { data: duplicados } = useVerificarDuplicado(debSocial, debCorreo, !cliente && crear.isIdle)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const body: Record<string, unknown> = { ...form }
      if (!body.respuesta_seguridad) delete body.respuesta_seguridad
      if (!body.tipo_vivienda) body.tipo_vivienda = null
      if (!body.phone_2) body.phone_2 = null
      if (!body.whatsapp) body.whatsapp = null
      if (!body.contacto_emergencia_nombre) body.contacto_emergencia_nombre = null
      if (!body.contacto_emergencia_telefono) body.contacto_emergencia_telefono = null
      if (!body.contacto_emergencia_email) body.contacto_emergencia_email = null

      if (cliente) {
        await actualizar.mutateAsync(body)
        toast.success('Datos del titular guardados')
      } else {
        const created = await crear.mutateAsync(body)
        toast.success('Cliente creado — continúa con los siguientes pasos')
        onCreated?.(created.id)
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo guardar'))
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {!!duplicados?.length && (
        <Card className="border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex gap-2.5 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1.5">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Ya existe{duplicados.length > 1 ? 'n' : ''} {duplicados.length > 1 ? 'clientes' : 'un cliente'} con el mismo {duplicados[0].coincide_por.join(' o ')} — verifica que no sea una venta duplicada.
              </p>
              <ul className="space-y-0.5 text-amber-700/90 dark:text-amber-400/90">
                {duplicados.map((d) => (
                  <li key={d.id}>
                    {d.nombres} {d.apellidos} · {ESTADO_CLIENTE_LABEL[d.estado]} · agente {d.agente_nombre}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <label className="flex items-center gap-2 text-sm">
        <Switch checked={form.solicita_cobertura} onCheckedChange={(v) => set('solicita_cobertura', v)} disabled={!editable} />
        El titular solicita cobertura
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nombres" required>
          <Input value={form.nombres} onChange={(e) => set('nombres', e.target.value)} required disabled={!editable} />
        </FormField>
        <FormField label="Apellidos" required>
          <Input value={form.apellidos} onChange={(e) => set('apellidos', e.target.value)} required disabled={!editable} />
        </FormField>
        <FormField label="Sexo" required>
          <Select value={form.sexo} onValueChange={(v) => set('sexo', v)} disabled={!editable}>
            <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
            <SelectContent>{SEXO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField label="Fecha de nacimiento" required>
          <Input type="date" value={form.fecha_nacimiento} onChange={(e) => set('fecha_nacimiento', e.target.value)} required disabled={!editable} />
          {edad != null && <p className="mt-1 text-xs text-muted-foreground">Edad: {edad} años</p>}
        </FormField>
        <FormField label="Social Security Number (SSN)" required>
          <Input
            value={form.social}
            onChange={(e) => set('social', e.target.value.replace(/\D/g, '').slice(0, 9))}
            placeholder="9 dígitos"
            required
            disabled={!editable}
          />
        </FormField>
        <FormField label="Estatus migratorio" required>
          <Select value={form.estatus_migratorio} onValueChange={(v) => set('estatus_migratorio', v)} disabled={!editable}>
            <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
            <SelectContent>{ESTATUS_MIGRATORIO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Dirección" required className="sm:col-span-2 space-y-1.5">
          <Input value={form.direccion} onChange={(e) => set('direccion', e.target.value)} required disabled={!editable} />
        </FormField>
        <FormField label="Tipo de vivienda">
          <Input value={form.tipo_vivienda} onChange={(e) => set('tipo_vivienda', e.target.value)} disabled={!editable} />
        </FormField>
        <FormField label="Código postal" required>
          <Input value={form.codigo_postal} onChange={(e) => set('codigo_postal', e.target.value.replace(/\D/g, '').slice(0, 5))} required disabled={!editable} />
        </FormField>
        <LocationSelector
          estado={form.estado_us}
          condado={form.condado}
          ciudad={form.ciudad}
          onChange={(next) => setForm((f) => ({ ...f, estado_us: next.estado, condado: next.condado, ciudad: next.ciudad }))}
          disabled={!editable}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Correo electrónico" required>
          <Input type="email" value={form.correo_electronico} onChange={(e) => set('correo_electronico', e.target.value)} required disabled={!editable} />
        </FormField>
        <FormField label="Teléfono principal" required>
          <Input value={form.phone_1} onChange={(e) => set('phone_1', e.target.value)} required disabled={!editable} />
        </FormField>
        <FormField label="Teléfono secundario">
          <Input value={form.phone_2} onChange={(e) => set('phone_2', e.target.value)} disabled={!editable} />
        </FormField>
        <FormField label="WhatsApp">
          <Input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} disabled={!editable} />
        </FormField>
      </div>

      <div className="rounded-lg border border-dashed p-4">
        <p className="mb-3 text-sm font-medium">Contacto de emergencia (opcional)</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Nombre">
            <Input value={form.contacto_emergencia_nombre} onChange={(e) => set('contacto_emergencia_nombre', e.target.value)} disabled={!editable} />
          </FormField>
          <FormField label="Teléfono">
            <Input value={form.contacto_emergencia_telefono} onChange={(e) => set('contacto_emergencia_telefono', e.target.value)} disabled={!editable} />
          </FormField>
          <FormField label="Correo">
            <Input type="email" value={form.contacto_emergencia_email} onChange={(e) => set('contacto_emergencia_email', e.target.value)} disabled={!editable} />
          </FormField>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Origen de la venta" required>
          <Select value={form.origen_venta} onValueChange={(v) => set('origen_venta', v)} disabled={!editable}>
            <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
            <SelectContent>
              {ORIGEN_VENTA.map((s) => <SelectItem key={s} value={s}>{ORIGEN_VENTA_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="rounded-lg border border-dashed p-4">
        <p className="mb-3 text-sm font-medium">Pregunta de seguridad</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Pregunta" required>
            <Textarea rows={1} value={form.pregunta_seguridad} onChange={(e) => set('pregunta_seguridad', e.target.value)} required disabled={!editable} />
          </FormField>
          <FormField label={cliente ? 'Respuesta (dejar vacío para no cambiarla)' : 'Respuesta'} required={!cliente}>
            <Input
              type="password"
              value={form.respuesta_seguridad}
              onChange={(e) => set('respuesta_seguridad', e.target.value)}
              required={!cliente}
              disabled={!editable}
            />
          </FormField>
        </div>
      </div>

      {editable && (
        <Button type="submit" disabled={busy}>
          {busy ? 'Guardando...' : cliente ? 'Guardar cambios del titular' : 'Crear cliente y continuar'}
        </Button>
      )}
    </form>
  )
}
