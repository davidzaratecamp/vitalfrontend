import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '../FormField'
import { usePlanSalud, useSetPlanSalud } from '@/hooks/clientes'
import { useAseguradoras, useAseguradorasPorEstado, useAseguradorasPorProductor, useNpnProductores } from '@/hooks/catalogos'
import { apiErrorMessage } from '@/lib/api'
import { TIPO_METAL, TIPO_RED } from '@/lib/clienteConstants'

const empty = {
  aseguradora_id: '',
  nombre_plan: '',
  tipo_metal: '',
  tipo_red: '',
  deducible: '',
  gasto_max_bolsillo: '',
  valor_prima: '',
  pd: '',
  sd: '',
  gd: '',
  npn_productor_id: '',
}

export function PlanSaludStep({
  clienteId,
  editable,
  estado,
}: {
  /** Sin cliente todavía (antes de guardar el Paso 1) el paso se puede ver
   * — para saber qué ofrecer desde ya — pero no guardar. */
  clienteId?: number
  editable: boolean
  /** Estado (EE. UU.) elegido en el Paso 1 — ya no se usa el código postal
   * para esto. */
  estado?: string
}) {
  const { data: plan, isLoading } = usePlanSalud(clienteId)
  const { data: todasLasAseguradoras } = useAseguradoras()
  const { data: porEstado } = useAseguradorasPorEstado(estado)
  const { data: productores } = useNpnProductores()
  const [form, setForm] = useState(empty)
  // Dos productores en el mismo estado pueden vender aseguradoras
  // distintas (cada uno licenciado con compañías distintas) — si ya se
  // eligió un productor, se prioriza SU cobertura sobre la del estado en
  // general; si no tiene datos para este estado, se cae al estado solo; si
  // tampoco, al catálogo completo. Nunca se bloquea el paso por falta de
  // datos de cobertura.
  const { data: porProductor } = useAseguradorasPorProductor(form.npn_productor_id, estado)
  const aseguradoras = form.npn_productor_id && porProductor?.length ? porProductor : porEstado?.length ? porEstado : todasLasAseguradoras
  const setPlan = useSetPlanSalud(clienteId ?? 0)

  useEffect(() => {
    if (!plan) return
    setForm({
      aseguradora_id: String(plan.aseguradora_id),
      nombre_plan: plan.nombre_plan,
      tipo_metal: plan.tipo_metal,
      tipo_red: plan.tipo_red,
      deducible: plan.deducible ?? '',
      gasto_max_bolsillo: plan.gasto_max_bolsillo ?? '',
      valor_prima: plan.valor_prima,
      pd: plan.pd ?? '',
      sd: plan.sd ?? '',
      gd: plan.gd ?? '',
      npn_productor_id: plan.npn_productor_id ? String(plan.npn_productor_id) : '',
    })
  }, [plan])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!clienteId) return
    try {
      await setPlan.mutateAsync({
        aseguradora_id: Number(form.aseguradora_id),
        nombre_plan: form.nombre_plan,
        tipo_metal: form.tipo_metal,
        tipo_red: form.tipo_red,
        deducible: form.deducible === '' ? null : Number(form.deducible),
        gasto_max_bolsillo: form.gasto_max_bolsillo === '' ? null : Number(form.gasto_max_bolsillo),
        valor_prima: Number(form.valor_prima),
        pd: form.pd === '' ? null : form.pd,
        sd: form.sd === '' ? null : form.sd,
        gd: form.gd === '' ? null : form.gd,
        npn_productor_id: form.npn_productor_id === '' ? null : Number(form.npn_productor_id),
      })
      toast.success('Plan de salud guardado')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo guardar'))
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando...</p>

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {plan?.version_origen === 'confirmado_backoffice' && (
        <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
          Este plan ya fue confirmado por BackOffice. Si lo modificas aquí, se registra como una nueva cotización.
        </p>
      )}
      {estado && (
        <p
          className={`rounded-md px-3 py-2 text-xs ${
            aseguradoras === todasLasAseguradoras
              ? 'bg-secondary text-secondary-foreground'
              : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
          }`}
        >
          {form.npn_productor_id && porProductor?.length
            ? `${porProductor.length} aseguradora${porProductor.length > 1 ? 's' : ''} que ${productores?.find((p) => String(p.id) === form.npn_productor_id)?.nombre ?? 'este productor'} puede vender en ${estado}.`
            : form.npn_productor_id && porProductor && porProductor.length === 0
              ? `Este productor no tiene cobertura definida en ${estado} — se muestra la disponible por estado.`
              : porEstado?.length
                ? `${porEstado.length} aseguradora${porEstado.length > 1 ? 's' : ''} disponible${porEstado.length > 1 ? 's' : ''} para ${estado}.`
                : `Sin cobertura específica definida para ${estado} — se muestra el catálogo completo.`}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Productor (NPN)">
          <Select value={form.npn_productor_id} onValueChange={(v) => set('npn_productor_id', v)} disabled={!editable}>
            <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
            <SelectContent>
              {productores?.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Aseguradora" required>
          <Select value={form.aseguradora_id} onValueChange={(v) => set('aseguradora_id', v)} disabled={!editable}>
            <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
            <SelectContent>
              {aseguradoras?.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Nombre del plan" required>
          <Input value={form.nombre_plan} onChange={(e) => set('nombre_plan', e.target.value)} required disabled={!editable} />
        </FormField>
        <FormField label="Tipo (metal)" required>
          <Select value={form.tipo_metal} onValueChange={(v) => set('tipo_metal', v)} disabled={!editable}>
            <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
            <SelectContent>{TIPO_METAL.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField label="Red" required>
          <Select value={form.tipo_red} onValueChange={(v) => set('tipo_red', v)} disabled={!editable}>
            <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
            <SelectContent>{TIPO_RED.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField label="Deducible (USD)">
          <Input type="number" min={0} step="0.01" value={form.deducible} onChange={(e) => set('deducible', e.target.value)} disabled={!editable} />
        </FormField>
        <FormField label="Gasto máximo de bolsillo (USD)">
          <Input type="number" min={0} step="0.01" value={form.gasto_max_bolsillo} onChange={(e) => set('gasto_max_bolsillo', e.target.value)} disabled={!editable} />
        </FormField>
        <FormField label="Valor de la prima (USD)" required>
          <Input type="number" min={0} step="0.01" value={form.valor_prima} onChange={(e) => set('valor_prima', e.target.value)} required disabled={!editable} />
        </FormField>
      </div>
      <div className="space-y-3 rounded-md border p-3">
        <p className="text-xs font-medium text-muted-foreground">
          Cobertura para la carta de firma — cópialo tal como aparece en la pantalla "Usted paga" (ej. "Sin cargo por visita desde el día 1", "$100 por visita desde el día 1", "50% coaseguro después del deducible").
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Atención primaria (PD)">
            <Input value={form.pd} onChange={(e) => set('pd', e.target.value)} disabled={!editable} placeholder="Sin cargo por visita desde el día 1" />
          </FormField>
          <FormField label="Atención de especialista (SD)">
            <Input value={form.sd} onChange={(e) => set('sd', e.target.value)} disabled={!editable} placeholder="$100 por visita desde el día 1" />
          </FormField>
          <FormField label="Medicamento genérico (GD)">
            <Input value={form.gd} onChange={(e) => set('gd', e.target.value)} disabled={!editable} placeholder="$35 Copago después del deducible" />
          </FormField>
        </div>
      </div>
      {editable && !clienteId && (
        <p className="text-xs text-muted-foreground">Completa y guarda el Paso 1 (Datos del titular) para poder guardar este paso — por ahora solo puedes ver qué aseguradoras ofrecer.</p>
      )}
      {editable && (
        <Button type="submit" disabled={setPlan.isPending || !clienteId}>{setPlan.isPending ? 'Guardando...' : 'Guardar paso'}</Button>
      )}
    </form>
  )
}
