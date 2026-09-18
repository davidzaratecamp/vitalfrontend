import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Search, TriangleAlert, UserRound } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from './FormField'
import { useVerificarTelefono } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'
import { ESTADO_CLIENTE_LABEL } from '@/lib/clienteConstants'
import type { ClienteContacto } from '@/lib/types'

/**
 * Compuerta antes de mostrar el formulario de "Nuevo registro": el agente
 * valida el teléfono. Si no hay ningún cliente con ese teléfono, se deja
 * crear uno nuevo (con el teléfono ya puesto). Si sí existe, se avisa con
 * nombre e ID (copiable) — no se abre el formulario solo, el agente decide
 * qué hacer con esa información.
 */
export function ValidacionContacto({ onNuevo }: { onNuevo: (datos: { phone_1: string }) => void }) {
  const [telefono, setTelefono] = useState('')
  const [coincidencias, setCoincidencias] = useState<ClienteContacto[] | null>(null)
  const verificar = useVerificarTelefono()

  const listo = telefono.length >= 7

  async function validar() {
    try {
      const data = await verificar.mutateAsync({ telefono })
      if (data.length) {
        setCoincidencias(data)
      } else {
        setCoincidencias(null)
        onNuevo({ phone_1: telefono })
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo validar'))
    }
  }

  function copiarId(id: number) {
    navigator.clipboard.writeText(String(id))
    toast.success(`ID ${id} copiado`)
  }

  return (
    <Card className="mx-auto max-w-lg space-y-4 p-6">
      <div>
        <h2 className="text-base font-semibold">Antes de empezar, valida el contacto</h2>
        <p className="text-sm text-muted-foreground">
          Escribe el teléfono del cliente — así confirmamos que no esté ya registrado antes de abrir un formulario nuevo.
        </p>
      </div>

      <FormField label="Teléfono" required>
        <Input
          value={telefono}
          onChange={(e) => {
            setTelefono(e.target.value.replace(/\D/g, '').slice(0, 15))
            setCoincidencias(null)
          }}
          placeholder="3051234567"
        />
      </FormField>

      <Button onClick={validar} disabled={!listo || verificar.isPending} className="w-full">
        <Search className="size-4" />
        {verificar.isPending ? 'Validando...' : 'Validar'}
      </Button>

      {coincidencias && (
        <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex gap-2.5 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Ya existe{coincidencias.length > 1 ? 'n' : ''} {coincidencias.length > 1 ? 'clientes' : 'un cliente'} con ese teléfono — no se abrió el formulario nuevo.
            </p>
          </div>
          <div className="space-y-2">
            {coincidencias.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-md bg-background p-2.5 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <UserRound className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.nombres} {c.apellidos}</p>
                    <p className="text-xs text-muted-foreground">
                      ID {c.id} · {ESTADO_CLIENTE_LABEL[c.estado]} · agente {c.agente_nombre}
                    </p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => copiarId(c.id)}>
                  <Copy className="size-3.5" /> ID
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
