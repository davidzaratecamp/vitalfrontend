// Espejo de backend/src/modules/clientes/clientes.constants.js — un solo lugar
// para no repetir la falla del CRM original (mismo catálogo escrito distinto
// en cada formulario).

// id de 'Vital Asiste' en `empresas` (Vital=1, Vital Asiste=2, fijo desde
// que se creó la tabla) — un backoffice solo ve clientes de su propia
// empresa, así que `user.empresa_id` alcanza para saber si el cliente que
// está viendo es de Vital Asiste. Ver ClienteResumen.tsx (permiso de
// datos de tarjeta) y clientes.constants.js#EMPRESA_VITAL_ASISTE_ID.
export const EMPRESA_VITAL_ASISTE_ID = 2

// Lo seleccionable hoy. 'PAROLE HUMANITARIO' salió del catálogo el
// 2026-10-22 (pedido del usuario) pero sigue existiendo en la base para los
// registros viejos que ya lo tenían — por eso se ve en un registro antiguo
// aunque ya no aparezca en el desplegable. Ver
// ESTATUS_MIGRATORIO_HISTORICOS en clientes.constants.js.
export const ESTATUS_MIGRATORIO = [
  'RESIDENTE',
  'CIUDADANO',
  'PERMISO DE TRABAJO',
  'PASAPORTE',
  'VISA DE TRABAJO',
  'ASILO/REFUGIADO',
  'ASILO/POLITICO',
  'TPS',
  'GREEN CARD',
  'I-220A',
  'I-797 (PROCESO PERMISO DE TRABAJO)',
  'I-797 (PROCESO RESIDENCIA)',
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

// Categorías del Paso 7 (evidencias) — cada una es su propio casillero en
// vez de una lista plana de archivos sin etiquetar. poliza/
// estatus_migratorio/licencia son obligatorias para poder finalizar;
// social y carta_cms_anterior son opcionales (carta_cms_anterior es para
// postventa: cuando el cliente pide actualizar su póliza, se guarda la
// carta vieja antes de hacer firmar la nueva). El orden acá es el orden en
// que se muestran.
export const CATEGORIA_EVIDENCIA = ['poliza', 'estatus_migratorio', 'licencia', 'social', 'carta_cms_anterior'] as const
export const CATEGORIA_EVIDENCIA_LABEL: Record<string, string> = {
  poliza: 'Póliza',
  estatus_migratorio: 'Estatus migratorio',
  licencia: 'Licencia',
  social: 'Social',
  carta_cms_anterior: 'Carta CMS anterior',
}
export const CATEGORIA_EVIDENCIA_OBLIGATORIA = ['poliza', 'estatus_migratorio', 'licencia'] as const

export const ESTADO_CLIENTE_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  pendiente_backoffice: 'Pendiente BackOffice',
  pendiente_llamada_tripartita: 'Pendiente llamada tripartita',
  aprobado: 'Aprobado',
  rechazado_backoffice: 'Rechazado por BackOffice',
  pendiente_renovacion: 'Pendiente renovación',
  pendiente_backoffice_renovacion: 'Pendiente BackOffice renovación',
  pendiente_autorizacion_renovacion: 'Pendiente autorización renovación',
  rechazado_backoffice_renovacion: 'Rechazo BackOffice renovación',
  renovado: 'Renovado',
}

export const ESTADO_CLIENTE_COLOR: Record<string, string> = {
  borrador: 'bg-secondary text-secondary-foreground',
  pendiente_backoffice: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  pendiente_llamada_tripartita: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  aprobado: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rechazado_backoffice: 'bg-red-500/10 text-red-600 dark:text-red-400',
  // Los estados de renovación usan la misma familia de color que su
  // equivalente de venta (ámbar = en cola, celeste = parada intermedia,
  // rojo = rechazo) pero en violeta para "Renovado", que es el cierre del
  // ciclo y no debe confundirse de un vistazo con un "Aprobado" de venta.
  pendiente_renovacion: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  pendiente_backoffice_renovacion: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  pendiente_autorizacion_renovacion: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  rechazado_backoffice_renovacion: 'bg-red-500/10 text-red-600 dark:text-red-400',
  renovado: 'bg-violet-600/15 text-violet-700 dark:text-violet-300',
}

// Espejo de ESTADOS_EN_TRAMITE (backend, clientes.constants.js) — mientras
// el cliente está acá, ni el propio agente dueño puede editar el
// formulario (BackOffice/la llamada tripartita lo está revisando en
// simultáneo). Todo lo demás (borrador, rechazado_backoffice, y desde
// 2026-09-29 también aprobado) es editable para el dueño.
export const ESTADOS_EN_TRAMITE = [
  'pendiente_backoffice',
  'pendiente_llamada_tripartita',
  'pendiente_backoffice_renovacion',
  'pendiente_autorizacion_renovacion',
]

/* ───────────────────────── Renovaciones ───────────────────────── */

// Espejo de clientes.constants.js. Cada 1 de noviembre toda póliza vigente
// vuelve al agente para renovarla, CON EL MISMO ID — una renovación no es
// un registro nuevo, es la venta de siempre en otro estado.
export const ESTADOS_RENOVACION = [
  'pendiente_renovacion',
  'pendiente_backoffice_renovacion',
  'pendiente_autorizacion_renovacion',
  'rechazado_backoffice_renovacion',
  'renovado',
]

// Donde el agente tiene la pelota (espejo de borrador/rechazado en ventas).
export const ESTADOS_RENOVACION_AGENTE = ['pendiente_renovacion', 'rechazado_backoffice_renovacion']

// Donde la tiene BackOffice.
export const ESTADOS_RENOVACION_BACKOFFICE = [
  'pendiente_backoffice_renovacion',
  'pendiente_autorizacion_renovacion',
]

export const esRenovacion = (estado?: string | null) => !!estado && ESTADOS_RENOVACION.includes(estado)

// Marca del historial cuando la temporada mueve una póliza sola.
export const APERTURA_RENOVACION_PREFIJO = '[Renovación]'

// Etiquetas legibles de `historial_cambios_cliente` — la tabla guarda el
// nombre crudo de la columna, el nombre bonito se arma acá.
export const SECCION_CAMBIO_LABEL: Record<string, string> = {
  titular: 'Titular',
  conyuge: 'Cónyuge',
  dependiente: 'Dependiente',
  ingresos: 'Ingresos',
  plan_salud: 'Plan de salud',
  pago: 'Pago',
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
