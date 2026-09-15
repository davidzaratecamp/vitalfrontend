import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '../FormField'
import { useConyuge, useSetConyuge } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'
import { SEXO, ESTATUS_MIGRATORIO } from '@/lib/clienteConstants'

const empty = {
  solicita_cobertura: false,
  medicare_medicaid: false,
  nombres: '',
  apellidos: '',
  sexo: '',
  fecha_nacimiento: '',
  social: '',
  estatus_migratorio: '',
}

export function ConyugeStep({ clienteId, editable }: { clienteId: number; editable: boolean }) {
  const { data: conyuge, isLoading } = useConyuge(clienteId)
  const setConyuge = useSetConyuge(clienteId)
  const [noTiene, setNoTiene] = useState(false)
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (conyuge) {
      setNoTiene(false)
      setForm({
        solicita_cobertura: conyuge.solicita_cobertura,
        medicare_medicaid: conyuge.medicare_medicaid,
        nombres: conyuge.nombres,
        apellidos: conyuge.apellidos,
        sexo: conyuge.sexo,
        fecha_nacimiento: conyuge.fecha_nacimiento?.slice(0, 10) ?? '',
        social: conyuge.social ?? '',
        estatus_migratorio: conyuge.estatus_migratorio,
      })
    } else if (!isLoading) {
      setNoTiene(true)
    }
  }, [conyuge, isLoading])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (noTiene) {
        await setConyuge.mutateAsync({ no_tiene: true })
        toast.success('Guardado: sin cónyuge')
        return
      }
      await setConyuge.mutateAsync({ ...form, social: form.social || null })
      toast.success('Cónyuge guardado')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo guardar'))
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando...</p>

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={noTiene} onCheckedChange={setNoTiene} disabled={!editable} />
        El titular no tiene cónyuge
      </label>

      {!noTiene && (
        <>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.solicita_cobertura} onCheckedChange={(v) => set('solicita_cobertura', v)} disabled={!editable} />
              Solicita cobertura
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.medicare_medicaid} onCheckedChange={(v) => set('medicare_medicaid', v)} disabled={!editable} />
              Tiene Medicare/Medicaid
            </label>
          </div>
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
            </FormField>
            <FormField label="Social Security Number">
              <Input value={form.social} onChange={(e) => set('social', e.target.value.replace(/\D/g, '').slice(0, 9))} disabled={!editable} />
            </FormField>
            <FormField label="Estatus migratorio" required>
              <Select value={form.estatus_migratorio} onValueChange={(v) => set('estatus_migratorio', v)} disabled={!editable}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>{ESTATUS_MIGRATORIO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
          </div>
        </>
      )}

      {editable && (
        <Button type="submit" disabled={setConyuge.isPending}>
          {setConyuge.isPending ? 'Guardando...' : 'Guardar paso'}
        </Button>
      )}
    </form>
  )
}
