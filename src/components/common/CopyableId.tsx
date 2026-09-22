import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Copia texto al portapapeles con respaldo para HTTP plano — el sitio en
 * producción se sirve por IP sin HTTPS, y `navigator.clipboard` (la API
 * moderna) solo existe en "contextos seguros" (HTTPS o localhost); en HTTP
 * simple ni siquiera está definida, así que fallaba siempre (2026-09-22).
 * El respaldo (`execCommand('copy')` sobre un textarea oculto) es viejo y
 * está deprecado, pero sigue funcionando en todos los navegadores
 * corrientes y no exige contexto seguro.
 */
async function copiarTexto(texto: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(texto)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = texto
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  textarea.remove()
  if (!ok) throw new Error('execCommand copy falló')
}

/**
 * ID de la venta (fila `clientes.id`), visible y copiable con un clic —
 * antes ningún visualizador (admin/supervisor/backoffice) tenía forma de
 * ver ni copiar el ID del caso (2026-09-22).
 */
export function CopyableId({ id, className }: { id: number | string; className?: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar(e: React.MouseEvent) {
    // Se usa dentro de filas de tabla que navegan al hacer clic — sin esto,
    // copiar el ID también dispararía la navegación de la fila.
    e.stopPropagation()
    try {
      await copiarTexto(String(id))
      setCopiado(true)
      toast.success('ID copiado')
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      title="Copiar ID"
      className={`inline-flex shrink-0 items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/70 ${className ?? ''}`}
    >
      #{id}
      {copiado ? <Check className="size-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="size-3" />}
    </button>
  )
}
