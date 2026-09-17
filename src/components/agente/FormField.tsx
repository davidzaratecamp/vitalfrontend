import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

export function FormField({
  label,
  htmlFor,
  required,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  /** Nota corta bajo el campo (ej. "ya hay una tarjeta guardada"). */
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className ?? 'space-y-1.5'}>
      <Label htmlFor={htmlFor}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function StepStatus({ status }: { status: 'vacio' | 'progreso' | 'completo' }) {
  const map = {
    vacio: { label: 'Vacío', cls: 'bg-secondary text-secondary-foreground' },
    progreso: { label: 'En progreso', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    completo: { label: 'Completo', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  }[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${map.cls}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {map.label}
    </span>
  )
}
