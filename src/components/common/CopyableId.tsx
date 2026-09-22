import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

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
      await navigator.clipboard.writeText(String(id))
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
