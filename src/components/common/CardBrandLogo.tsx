import type { MarcaTarjeta } from '@/lib/types'

/** Marcas de tarjeta — representación gráfica simplificada (no el logo
 * oficial registrado), suficiente para que el agente identifique Visa vs
 * Mastercard de un vistazo. */
export function CardBrandLogo({ marca, className }: { marca: MarcaTarjeta | null | undefined; className?: string }) {
  if (marca === 'Visa') {
    return (
      <svg viewBox="0 0 48 30" className={className} role="img" aria-label="Visa">
        <rect width="48" height="30" rx="4" fill="#fff" />
        <text
          x="24"
          y="20"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontStyle="italic"
          fontWeight="bold"
          fontSize="14"
          fill="#1A1F71"
          letterSpacing="0.5"
        >
          VISA
        </text>
      </svg>
    )
  }
  if (marca === 'Mastercard') {
    return (
      <svg viewBox="0 0 48 30" className={className} role="img" aria-label="Mastercard">
        <rect width="48" height="30" rx="4" fill="#fff" />
        <circle cx="20" cy="15" r="9" fill="#EB001B" />
        <circle cx="30" cy="15" r="9" fill="#F79E1B" fillOpacity="0.85" />
      </svg>
    )
  }
  return null
}
