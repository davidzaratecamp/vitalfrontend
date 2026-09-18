import { useMemo, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface SearchSelectOption {
  value: string
  label: string
}

/**
 * Desplegable con buscador — para listas que pueden crecer mucho (agentes,
 * etc.) donde un <Select> normal obliga a hacer scroll para encontrar uno.
 * Sin dependencia nueva: Popover + Input ya existían en el proyecto.
 */
export function SearchSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Buscar...',
  allLabel = 'Todos',
  className,
}: {
  value: string
  onValueChange: (v: string) => void
  options: SearchSelectOption[]
  placeholder?: string
  /** Etiqueta de la opción "sin filtro" (value siempre 'all'). */
  allLabel?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  const seleccionada = value === 'all' ? allLabel : (options.find((o) => o.value === value)?.label ?? allLabel)

  function elegir(v: string) {
    onValueChange(v)
    setOpen(false)
    setQuery('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring',
            className,
          )}
        >
          <span className="line-clamp-1 text-left">{seleccionada}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="h-7 border-0 p-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => elegir('all')}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Check className={cn('size-3.5 shrink-0', value === 'all' ? 'opacity-100' : 'opacity-0')} />
            {allLabel}
          </button>
          {filtradas.length === 0 && <p className="px-2 py-3 text-center text-xs text-muted-foreground">Sin resultados.</p>}
          {filtradas.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => elegir(o.value)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Check className={cn('size-3.5 shrink-0', value === o.value ? 'opacity-100' : 'opacity-0')} />
              <span className="line-clamp-1">{o.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
