import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '../FormField'
import { useDependientes, useAgregarDependiente, useEliminarDependiente } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'
import { SEXO, ESTATUS_MIGRATORIO, PARENTESCO } from '@/lib/clienteConstants'
import { fmtDate } from '@/lib/dateFormat'

const empty = {
  parentesco: 'Hijo',
  solicita_cobertura: false,
  medicare_medicaid: false,
  nombres: '',
  apellidos: '',
  sexo: '',
  fecha_nacimiento: '',
  social: '',
  estatus_migratorio: '',
}

export function DependientesStep({ clienteId, editable }: { clienteId: number; editable: boolean }) {
  const { data: dependientes, isLoading } = useDependientes(clienteId)
  const agregar = useAgregarDependiente(clienteId)
  const eliminar = useEliminarDependiente(clienteId)
  const [form, setForm] = useState(empty)
  const [showForm, setShowForm] = useState(false)

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await agregar.mutateAsync({ ...form, social: form.social || null })
      toast.success('Dependiente agregado')
      setForm(empty)
      setShowForm(false)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo agregar'))
    }
  }

  async function eliminarDep(id: number) {
    try {
      await eliminar.mutateAsync(id)
      toast.success('Dependiente eliminado')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo eliminar'))
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando...</p>

  return (
    <div className="space-y-4">
      {!dependientes?.length && !showForm && (
        <p className="text-sm text-muted-foreground">El titular no tiene dependientes declarados todavía.</p>
      )}

      {!!dependientes?.length && (
        <div className="space-y-2">
          {dependientes.map((d) => (
            <Card key={d.id} className="flex items-center justify-between gap-3 p-3">
              <div className="text-sm">
                <p className="font-medium">{d.nombres} {d.apellidos} <span className="text-muted-foreground">· {d.parentesco}</span></p>
                <p className="text-xs text-muted-foreground">
                  {d.sexo} · nace {fmtDate(d.fecha_nacimiento)} · {d.estatus_migratorio}
                  {!!d.solicita_cobertura && ' · solicita cobertura'}
                  {!!d.medicare_medicaid && ' · Medicare/Medicaid'}
                </p>
              </div>
              {editable && (
                <Button type="button" variant="ghost" size="icon" onClick={() => eliminarDep(d.id)} disabled={eliminar.isPending}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {editable && !showForm && (
        <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="size-4" /> Agregar dependiente
        </Button>
      )}

      {editable && showForm && (
        <form onSubmit={submit} noValidate className="space-y-4 rounded-lg border border-dashed p-4">
          <div className="flex flex-wrap gap-6">
            <FormField label="Parentesco" required className="w-48 space-y-1.5">
              <Select value={form.parentesco} onValueChange={(v) => set('parentesco', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PARENTESCO.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <label className="mt-6 flex items-center gap-2 text-sm">
              <Switch checked={form.solicita_cobertura} onCheckedChange={(v) => set('solicita_cobertura', v)} />
              Solicita cobertura
            </label>
            <label className="mt-6 flex items-center gap-2 text-sm">
              <Switch checked={form.medicare_medicaid} onCheckedChange={(v) => set('medicare_medicaid', v)} />
              Medicare/Medicaid
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nombres" required>
              <Input value={form.nombres} onChange={(e) => set('nombres', e.target.value)} required />
            </FormField>
            <FormField label="Apellidos" required>
              <Input value={form.apellidos} onChange={(e) => set('apellidos', e.target.value)} required />
            </FormField>
            <FormField label="Sexo" required>
              <Select value={form.sexo} onValueChange={(v) => set('sexo', v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>{SEXO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Fecha de nacimiento" required>
              {/* lang="en-US" fuerza mes/día/año en el picker nativo. */}
              <Input type="date" lang="en-US" value={form.fecha_nacimiento} onChange={(e) => set('fecha_nacimiento', e.target.value)} required />
            </FormField>
            <FormField label="Social Security Number">
              <Input value={form.social} onChange={(e) => set('social', e.target.value.replace(/\D/g, '').slice(0, 9))} />
            </FormField>
            <FormField label="Estatus migratorio" required>
              <Select value={form.estatus_migratorio} onValueChange={(v) => set('estatus_migratorio', v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>{ESTATUS_MIGRATORIO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={agregar.isPending}>{agregar.isPending ? 'Guardando...' : 'Agregar'}</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}
    </div>
  )
}
