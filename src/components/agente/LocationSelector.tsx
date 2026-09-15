import { useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from './FormField'
import { UBICACIONES } from '@/data/locationsData'

export interface LocationValue {
  estado: string
  condado: string
  ciudad: string
}

/**
 * Estado → Condado → Ciudad en cascada, tal como en obamaBusqueda
 * (components/forms/LocationSelector.jsx): un solo array plano de EE. UU.
 * (1,554 combinaciones, `data/locationsData.ts`) del que se sacan listas
 * únicas por nivel, filtrando por lo ya elegido arriba.
 *
 * Mismo comportamiento que el original: elegir un estado limpia
 * condado+ciudad; elegir un condado limpia solo ciudad; condado empieza
 * deshabilitado hasta que hay estado, y ciudad hasta que hay condado. La
 * única diferencia real es de implementación, no de conducta: acá las
 * listas se derivan con `useMemo` en vez de tres `useEffect` con estado
 * propio — es la misma cascada, sin el ida-y-vuelta de sincronizar estado
 * derivado a mano.
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

  const condados = useMemo(() => {
    if (!estado) return []
    return [...new Set(UBICACIONES.filter((u) => u.estado === estado).map((u) => u.condado))].sort()
  }, [estado])

  const ciudades = useMemo(() => {
    if (!estado || !condado) return []
    return [...new Set(UBICACIONES.filter((u) => u.estado === estado && u.condado === condado).map((u) => u.ciudad))].sort()
  }, [estado, condado])

  return (
    <>
      <FormField label="Estado (EE. UU.)" required>
        <Select value={estado} onValueChange={(v) => onChange({ estado: v, condado: '', ciudad: '' })} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
          <SelectContent>{estados.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
        </Select>
      </FormField>

      <FormField label="Condado" required>
        <Select value={condado} onValueChange={(v) => onChange({ estado, condado: v, ciudad: '' })} disabled={disabled || !estado}>
          <SelectTrigger><SelectValue placeholder={estado ? 'Selecciona un condado' : 'Primero elige un estado'} /></SelectTrigger>
          <SelectContent>{condados.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </FormField>

      <FormField label="Ciudad" required>
        <Select value={ciudad} onValueChange={(v) => onChange({ estado, condado, ciudad: v })} disabled={disabled || !condado}>
          <SelectTrigger><SelectValue placeholder={condado ? 'Selecciona una ciudad' : 'Primero elige un condado'} /></SelectTrigger>
          <SelectContent>{ciudades.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </FormField>
    </>
  )
}
