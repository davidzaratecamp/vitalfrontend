/**
 * Vital atiende al mercado de EE. UU., así que toda fecha visible en la
 * interfaz se muestra en formato mes/día/año (MM/DD/YYYY), no año-mes-día.
 *
 * El backend manda fechas como "YYYY-MM-DD" o "YYYY-MM-DD HH:MM:SS" (texto
 * plano de MySQL, sin zona horaria). A propósito NO se pasan por `Date` acá:
 * un `new Date('2026-09-11')` sin hora se interpreta como medianoche UTC, y
 * en cualquier zona horaria detrás de UTC eso muestra el día anterior. Como
 * solo se trata de reordenar los mismos dígitos, se leen directo con regex.
 */
function partesFecha(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/)
  if (!m) return null
  return { y: m[1], mo: m[2], d: m[3], h: m[4], mi: m[5] }
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return ''
  const p = partesFecha(iso)
  return p ? `${p.mo}/${p.d}/${p.y}` : ''
}

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return ''
  const p = partesFecha(iso)
  if (!p) return ''
  const base = `${p.mo}/${p.d}/${p.y}`
  return p.h ? `${base} ${p.h}:${p.mi}` : base
}

const FECHA_FILTRO_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Guarda para el `onChange` de un filtro "Desde"/"Hasta" (`<input
 * type="date">`) — casi siempre `e.target.value` es '' o un YYYY-MM-DD
 * limpio, pero en producción (2026-09-25) se vio un valor con el año
 * duplicado ("92026-09-23") que el navegador dejó pasar igual y que
 * rompía la consulta en el backend con un error 500. `setter` solo se
 * llama si el valor es válido — un valor raro simplemente no cambia nada,
 * en vez de mandar algo que el backend va a tener que rechazar.
 */
export function onChangeFechaFiltro(valor: string, setter: (v: string) => void) {
  if (valor === '' || FECHA_FILTRO_RE.test(valor)) setter(valor)
}
