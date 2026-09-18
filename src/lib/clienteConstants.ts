// Espejo de backend/src/modules/clientes/clientes.constants.js — un solo lugar
// para no repetir la falla del CRM original (mismo catálogo escrito distinto
// en cada formulario).

export const ESTATUS_MIGRATORIO = [
  'RESIDENTE',
  'CIUDADANO',
  'PERMISO DE TRABAJO',
  'PASAPORTE',
  'VISA DE TRABAJO',
  'ASILO/REFUGIADO',
  'ASILO/POLITICO',
  'PAROLE HUMANITARIO',
  'TPS',
  'GREEN CARD',
  'I-220A',
]

export const SEXO = ['Masculino', 'Femenino'] as const

export const ORIGEN_VENTA = ['lead', 'referido', 'base'] as const
export const ORIGEN_VENTA_LABEL: Record<string, string> = { lead: 'Lead', referido: 'Referido', base: 'Base' }

export const PARENTESCO = ['Hijo', 'Hijastro', 'Padre', 'Madre', 'Otro']

export const TIPO_DECLARACION = ['W2', '1099'] as const

export const TIPO_METAL = ['Bronce', 'Plata', 'Oro', 'Platino'] as const
export const TIPO_RED = ['HMO', 'PPO', 'EPO'] as const

export const ESTADO_PRIMA = [
  'Pendiente de tarjeta',
  'Debito OK',
  'Debito automatico',
  'Debito rechazado',
  'Sin cargo de prima',
]

export const METODO_PAGO = ['tarjeta', 'debito_automatico', 'otro'] as const
export const METODO_PAGO_LABEL: Record<string, string> = {
  tarjeta: 'Tarjeta',
  debito_automatico: 'Débito automático',
  otro: 'Otro',
}

export const ESTADO_CLIENTE_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  pendiente_backoffice: 'Pendiente BackOffice',
  aprobado: 'Aprobado',
  rechazado_backoffice: 'Rechazado por BackOffice',
}

export const ESTADO_CLIENTE_COLOR: Record<string, string> = {
  borrador: 'bg-secondary text-secondary-foreground',
  pendiente_backoffice: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  aprobado: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rechazado_backoffice: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

// Estado del envío de la Carta CMS Vital (FirmaCloud) — ver hooks/firmas.ts.
export const ESTADO_FIRMA_LABEL: Record<string, string> = {
  pending: 'Enviada — pendiente de firma',
  viewed: 'Vista por el cliente',
  signed: 'Firmada',
  expired: 'Enlace expirado (72h)',
  failed: 'Error al enviar',
}

export const ESTADO_FIRMA_COLOR: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  viewed: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  signed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  expired: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  failed: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

const MESES = Array.from({ length: 12 }, (_, i) => i + 1)
export const MESES_EXPIRACION = MESES
export function aniosExpiracion(count = 12) {
  const y = new Date().getFullYear()
  return Array.from({ length: count }, (_, i) => y + i)
}
