/**
 * Lo que el agente escribe a mano en el formulario de venta se ve en
 * MAYÚSCULAS mientras lo escribe (2026-10-22, pedido del usuario).
 *
 * Esto es solo la mitad visible: quien de verdad normaliza es el backend
 * (`backend/src/utils/mayusculas.js`, en el schema de Zod), así que un dato
 * que entre por otro camino también queda en mayúsculas. Acá se transforma
 * el valor de verdad —no con `text-transform: uppercase`— para que lo que
 * se ve en pantalla sea exactamente lo que se va a guardar.
 *
 * La lista es por nombre de campo y la comparten todos los pasos del
 * formulario (Titular, Cónyuge, Dependientes, Plan de salud, Pago). Los
 * campos que NO están acá quedan como se escriben, a propósito: correos,
 * teléfonos y números (ya son dígitos), los valores de catálogo
 * (`estado_us`, `ciudad`, que se eligen de un desplegable y dejarían de
 * coincidir con su opción) y las notas/observaciones. Ver el comentario
 * largo en `backend/src/utils/mayusculas.js`.
 */
const CAMPOS_EN_MAYUSCULAS = new Set([
  'nombres',
  'apellidos',
  'direccion',
  'tipo_vivienda',
  'condado',
  'horario_contactabilidad',
  'contacto_emergencia_nombre',
  'pregunta_seguridad',
  'respuesta_seguridad',
  'nombre_plan',
  'npn',
  'pd',
  'sd_resto',
  'gd',
  'nombre_titular_tarjeta',
  'nombre_banco',
])

/** Devuelve el valor en mayúsculas si ese campo lo pide; si no, tal cual. */
export function enMayusculas<T>(campo: string, valor: T): T {
  if (typeof valor === 'string' && CAMPOS_EN_MAYUSCULAS.has(campo)) {
    return valor.toUpperCase() as unknown as T
  }
  return valor
}
