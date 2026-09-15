import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '../FormField'
import { useDependientes, useIngresos, useSetIngresoTitular, useSetIngresoDependiente } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'
import { TIPO_DECLARACION } from '@/lib/clienteConstants'
import { num } from '@/lib/analyticsFormat'
import type { Ingreso } from '@/lib/types'

function PersonaIngreso({
  label,
  ingreso,
  editable,
  onSave,
  saving,
  obligatorio,
}: {
  label: string
  ingreso?: Ingreso
  editable: boolean
  onSave: (v: { tiene_ingresos: boolean; tipo_declaracion: string; ingresos_semanales: number }) => void
  saving: boolean
  obligatorio?: boolean
}) {
  const [tiene, setTiene] = useState(!!ingreso || !!obligatorio)
  const [tipo, setTipo] = useState<string>(ingreso?.tipo_declaracion ?? 'W2')
  const [semanal, setSemanal] = useState(ingreso?.ingresos_semanales ?? '')

  useEffect(() => {
    setTiene(!!ingreso || !!obligatorio)
    setTipo(ingreso?.tipo_declaracion ?? 'W2')
    setSemanal(ingreso?.ingresos_semanales ?? '')
  }, [ingreso, obligatorio])

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        {!obligatorio && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={tiene} onCheckedChange={setTiene} disabled={!editable} />
            ¿Tiene ingresos?
          </label>
        )}
      </div>
      {tiene && (
        <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
          <FormField label="Tipo de declaración" required>
            <Select value={tipo} onValueChange={setTipo} disabled={!editable}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIPO_DECLARACION.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Ingresos semanales (USD)" required>
            <Input type="number" min={0} step="0.01" value={semanal} onChange={(e) => setSemanal(e.target.value)} disabled={!editable} required />
          </FormField>
          <p className="text-xs text-muted-foreground sm:pb-2.5">
            Anual: <span className="font-medium text-foreground">${num(Number(semanal || 0) * 52)}</span>
          </p>
        </div>
      )}
      {editable && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() => onSave({ tiene_ingresos: tiene, tipo_declaracion: tipo, ingresos_semanales: Number(semanal || 0) })}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      )}
    </Card>
  )
}

export function IngresosStep({ clienteId, editable }: { clienteId: number; editable: boolean }) {
  const { data: dependientes } = useDependientes(clienteId)
  const { data: ingresos } = useIngresos(clienteId)
  const setTitular = useSetIngresoTitular(clienteId)
  const setDep = useSetIngresoDependiente(clienteId)

  const ingresoTitular = ingresos?.rows.find((r) => r.dependiente_id == null)
  const ingresoPorDep = new Map((ingresos?.rows ?? []).filter((r) => r.dependiente_id != null).map((r) => [r.dependiente_id, r]))

  async function guardarTitular(v: { tiene_ingresos: boolean; tipo_declaracion: string; ingresos_semanales: number }) {
    try {
      await setTitular.mutateAsync(v)
      toast.success('Ingresos del titular guardados')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function guardarDep(depId: number, v: { tiene_ingresos: boolean; tipo_declaracion: string; ingresos_semanales: number }) {
    try {
      await setDep.mutateAsync({ depId, body: v })
      toast.success('Ingresos guardados')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <PersonaIngreso
        label="Titular (obligatorio)"
        ingreso={ingresoTitular}
        editable={editable}
        obligatorio
        saving={setTitular.isPending}
        onSave={guardarTitular}
      />
      {dependientes?.map((d) => (
        <PersonaIngreso
          key={d.id}
          label={`${d.nombres} ${d.apellidos} (${d.parentesco})`}
          ingreso={ingresoPorDep.get(d.id)}
          editable={editable}
          saving={setDep.isPending}
          onSave={(v) => guardarDep(d.id, v)}
        />
      ))}
      {!!ingresos && (
        <p className="text-sm text-muted-foreground">
          Total anual de la familia: <span className="font-medium text-foreground">${num(ingresos.total_familia)}</span>
        </p>
      )}
    </div>
  )
}
