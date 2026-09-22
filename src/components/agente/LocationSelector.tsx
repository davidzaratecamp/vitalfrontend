import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from './FormField'
import { UBICACIONES } from '@/data/locationsData'

export interface LocationValue {
  estado: string
  condado: string
  ciudad: string
}

/**
 * Estado → Ciudad en cascada (un solo array plano de EE. UU., 1,554
 * combinaciones, `data/locationsData.ts`, del que se saca la lista de
 * ciudades del estado elegido). El Condado dejó de ser un desplegable
 * atado al catálogo (2026-09-22, a pedido del usuario) — el agente lo
 * escribe manualmente, así que Ciudad ya no depende de él, solo del
 * Estado.
 */
export function LocationSelector({
  estado,
  condado,
  ciudad,
  onChange,
  disabled,
}: {
  estado: string
  condado: string
  ciudad: string
  onChange: (next: LocationValue) => void
  disabled?: boolean
}) {
  const estados = useMemo(() => [...new Set(UBICACIONES.map((u) => u.estado))].sort(), [])

  const ciudades = useMemo(() => {
    if (!estado) return []
    return [...new Set(UBICACIONES.filter((u) => u.estado === estado).map((u) => u.ciudad))].sort()
  }, [estado])

  return (
    <>
      <FormField label="Estado (EE. UU.)" required>
        <Select value={estado} onValueChange={(v) => onChange({ estado: v, condado, ciudad: '' })} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
          <SelectContent>{estados.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
        </Select>
      </FormField>

      <FormField label="Condado" required>
        <Input
          value={condado}
          onChange={(e) => onChange({ estado, condado: e.target.value, ciudad })}
          placeholder="Escribe el condado"
          disabled={disabled}
        />
      </FormField>

      <FormField label="Ciudad" required>
        <Select value={ciudad} onValueChange={(v) => onChange({ estado, condado, ciudad: v })} disabled={disabled || !estado}>
          <SelectTrigger><SelectValue placeholder={estado ? 'Selecciona una ciudad' : 'Primero elige un estado'} /></SelectTrigger>
          <SelectContent>{ciudades.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </FormField>
    </>
  )
}
