import { CreditCard } from 'lucide-react'
import { CardBrandLogo } from './CardBrandLogo'
import type { MarcaTarjeta } from '@/lib/types'

const GRADIENTS: Record<'Visa' | 'Mastercard' | 'Otra', string> = {
  Visa: 'linear-gradient(135deg, #1A1F71 0%, #2d3494 55%, #4650c9 100%)',
  Mastercard: 'linear-gradient(135deg, #1c1c1e 0%, #3a2320 55%, #5c2a1a 100%)',
  Otra: 'linear-gradient(135deg, oklch(0.32 0.05 280) 0%, oklch(0.42 0.09 278) 55%, oklch(0.55 0.16 275) 100%)',
}

/** Vista bonita de la tarjeta mientras el agente escribe — el número
 * completo nunca pasa por acá como texto visible: solo los últimos 4
 * dígitos (lo que ya viaja al backend) y la marca detectada por el
 * prefijo. */
export function CardPreview({
  ultimos4,
  marca,
  nombreTitular,
  mes,
  ano,
}: {
  ultimos4: string
  marca: MarcaTarjeta | null
  nombreTitular?: string
  mes?: number | null
  ano?: number | null
}) {
  const gradient = GRADIENTS[marca ?? 'Otra']
  const grupos = ['••••', '••••', '••••', ultimos4 ? ultimos4.padStart(4, '•') : '••••']

  return (
    <div
      className="flex aspect-[1.586/1] w-full max-w-[340px] flex-col justify-between rounded-2xl p-5 text-white shadow-lg"
      style={{ backgroundImage: gradient }}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-7 w-10 items-center justify-center rounded-md bg-white/20">
          <CreditCard className="size-4 text-white/90" />
        </div>
        <div className="h-[30px] w-12 overflow-hidden rounded">
          {marca && marca !== 'Otra' ? (
            <CardBrandLogo marca={marca} className="h-full w-full" />
          ) : (
            <span className="flex h-full items-center justify-center text-[10px] font-medium tracking-wide text-white/70">
              {marca === 'Otra' ? 'TARJETA' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="font-mono text-lg tracking-[0.15em] tabular-nums sm:text-xl">
        {grupos.join('  ')}
      </div>

      <div className="flex items-end justify-between text-xs">
        <span className="max-w-[70%] truncate uppercase tracking-wide text-white/85">
          {nombreTitular || 'NOMBRE DEL TITULAR'}
        </span>
        <span className="tabular-nums text-white/85">
          {mes ? String(mes).padStart(2, '0') : 'MM'}/{ano ? String(ano).slice(-2) : 'AA'}
        </span>
      </div>
    </div>
  )
}
