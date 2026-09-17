import type { MarcaTarjeta } from './types'

/** Detección de marca por el prefijo (BIN) — misma regla que el backend
 * (cardCrypto.js), para que la vista previa se actualice mientras el
 * agente escribe sin esperar al servidor. */
export function detectarMarcaTarjeta(numeroDigitos: string): MarcaTarjeta | null {
  if (!numeroDigitos) return null
  if (/^4/.test(numeroDigitos)) return 'Visa'
  if (/^(5[1-5]|2(2[2-9]\d|[3-6]\d{2}|7[01]\d|720))/.test(numeroDigitos)) return 'Mastercard'
  return numeroDigitos.length >= 4 ? 'Otra' : null
}

/** Agrupa en bloques de 4 para mostrar. Se usa tal cual en el input
 * (type="password", así que de todos modos solo se ven asteriscos —
 * agrupar o no es cosmético) y para el número ya revelado por BackOffice. */
export function formatearTarjeta(numeroDigitos: string): string {
  return (numeroDigitos.match(/.{1,4}/g) ?? []).join(' ')
}
