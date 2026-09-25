import type { ClienteDetalle } from './types'

export interface CambioReciente {
  seccion: string
  detalle: string
  cuando: string
}

/**
 * Qué secciones del cliente se tocaron después de una fecha de referencia
 * (2026-09-26, para la vista de Postventa de admin: "que se aparezcan
 * subrayados o resaltados los datos que se cambiaron"). No hay un log de
 * campo por campo en el sistema — esto es la mejor aproximación real sin
 * construir una auditoría nueva: compara el `updated_at` de cada tabla
 * (cliente, cónyuge/dependientes, ingresos, pago) contra la fecha de
 * referencia. El plan de salud no tiene `updated_at` (cada edición crea
 * una versión nueva, no actualiza la fila) — se usa `created_at` de la
 * versión vigente, que equivale a "cuándo se cotizó/confirmó por última
 * vez".
 */
export function calcularCambiosRecientes(cliente: ClienteDetalle, desdeIso: string): CambioReciente[] {
  const desde = new Date(desdeIso.replace(' ', 'T')).getTime()
  const cambios: CambioReciente[] = []

  function marcar(fecha: string | null | undefined, seccion: string, detalle: string) {
    if (!fecha) return
    const t = new Date(fecha.replace(' ', 'T')).getTime()
    if (t > desde) cambios.push({ seccion, detalle, cuando: fecha })
  }

  marcar(cliente.updated_at, 'titular', 'Datos del titular')
  for (const d of cliente.dependientes) {
    marcar(d.updated_at, d.parentesco === 'Conyuge' ? 'dependientes' : 'dependientes', d.parentesco === 'Conyuge' ? 'Cónyuge' : `Dependiente — ${d.nombres} ${d.apellidos}`)
  }
  for (const i of cliente.ingresos) {
    marcar(i.updated_at, 'ingresos', i.dependiente_id == null ? 'Ingresos del titular' : 'Ingresos de un dependiente')
  }
  marcar(cliente.plan_salud?.created_at, 'plan', 'Plan de salud')
  marcar(cliente.pago?.updated_at, 'pago', 'Información de pago')

  return cambios.sort((a, b) => new Date(b.cuando.replace(' ', 'T')).getTime() - new Date(a.cuando.replace(' ', 'T')).getTime())
}
