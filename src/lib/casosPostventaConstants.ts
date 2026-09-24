// Espejo de backend/src/modules/casosPostventa/casosPostventa.constants.js — mismo
// catálogo de "Listado Casos Postventa Vital 2026.xlsx", mismo patrón que
// clienteConstants.ts.

export const TIPO_CASO_POSTVENTA = [
  { valor: 'validacion_cobertura', nombre: 'Validación de Cobertura (doctores y medicamentos)', responsable: 'agente' },
  { valor: 'tarjetas_fisicas', nombre: 'Solicitud de Tarjetas Físicas', responsable: 'agente' },
  { valor: 'gestion_pagos', nombre: 'Gestión de Pagos', responsable: 'agente' },
  { valor: 'creacion_cuenta', nombre: 'Creación Cuenta Cliente', responsable: 'agente' },
  { valor: 'asignacion_citas', nombre: 'Asignación de Citas', responsable: 'agente' },
  { valor: 'asignacion_doctor', nombre: 'Asignación de Doctor Primario / Especialista', responsable: 'agente' },
  { valor: 'aclaracion_factura', nombre: 'Aclaración Factura', responsable: 'agente' },
  { valor: 'cambio_vida', nombre: 'Cambio de Vida', responsable: 'backoffice' },
  { valor: 'solicitud_cancelacion', nombre: 'Solicitud de Cancelación', responsable: 'backoffice' },
  { valor: 'solicitud_apelacion', nombre: 'Solicitud de Apelación', responsable: 'backoffice' },
  { valor: 'cambio_agente_aor', nombre: 'Solicitud Cambio de Agente (AOR)', responsable: 'backoffice' },
  { valor: 'cliente_no_aparece_broker', nombre: 'Gestión Cliente no Aparece en Brocker', responsable: 'backoffice' },
  { valor: 'autorizacion_poliza', nombre: 'Gestión de Autorización Póliza', responsable: 'backoffice' },
] as const

export const TIPO_CASO_POSTVENTA_LABEL: Record<string, string> = Object.fromEntries(
  TIPO_CASO_POSTVENTA.map((t) => [t.valor, t.nombre]),
)

export const TIPO_GESTION_POSTVENTA = ['reclamacion', 'cancelacion', 'gestion_habitual'] as const

export const TIPO_GESTION_POSTVENTA_LABEL: Record<string, string> = {
  reclamacion: 'Reclamación',
  cancelacion: 'Cancelación',
  gestion_habitual: 'Gestión habitual',
}

// Colores pedidos explícitamente por el usuario: Reclamación → naranja,
// Cancelación → rojo, Gestión habitual → verde.
export const TIPO_GESTION_POSTVENTA_COLOR: Record<string, string> = {
  reclamacion: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  cancelacion: 'bg-red-500/10 text-red-600 dark:text-red-400',
  gestion_habitual: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
}

export const ESTADO_CASO_POSTVENTA_LABEL: Record<string, string> = {
  nuevo: 'Nuevo',
  seguimiento: 'Seguimiento',
  cerrado: 'Cerrado',
  escalado_backoffice: 'Escalado a BackOffice',
}

export const ESTADO_CASO_POSTVENTA_COLOR: Record<string, string> = {
  nuevo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  seguimiento: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  cerrado: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  escalado_backoffice: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
}
