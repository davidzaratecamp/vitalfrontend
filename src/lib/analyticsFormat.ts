/** Formateadores compartidos por los paneles de analítica (Aware, etc.). */

export function pct(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${Math.round(n * 100)}%`
}

export function num(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString('es-CO')
}

/** segundos -> "2m 03s" / "45s" */
export function dur(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  const s = Math.round(seconds)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}m ${String(rem).padStart(2, '0')}s`
}

export function ms(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${Math.round(n)} ms`
}
