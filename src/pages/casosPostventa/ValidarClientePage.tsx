import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Search, UserRound, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useValidarTelefonoPostventa, useCrearCasoPostventa } from '@/hooks/casosPostventa'
import { TIPO_CASO_POSTVENTA } from '@/lib/casosPostventaConstants'
import { ESTADO_CLIENTE_LABEL } from '@/lib/clienteConstants'
import { apiErrorMessage } from '@/lib/api'
import type { ClientePostventaContacto } from '@/lib/types'

const CASOS_ATENCION_DIRECTA = TIPO_CASO_POSTVENTA.filter((t) => t.responsable === 'agente')
const CASOS_BACKOFFICE = TIPO_CASO_POSTVENTA.filter((t) => t.responsable === 'backoffice')

/**
 * Entrada de la pestaña Postventa (dentro de Agente, 2026-09-24: "el
 * customer es el mismo agente") — antes de gestionar nada, valida el
 * teléfono que da el cliente en la llamada. Solo busca entre clientes ya
 * APROBADOS de tu misma empresa (sean o no tuyos); acá no se crea ningún
 * cliente nuevo, esto es exclusivamente postventa.
 */
export default function ValidarClientePage() {
  const navigate = useNavigate()
  const [telefono, setTelefono] = useState('')
  const [tipoCaso, setTipoCaso] = useState('')
  const [observacion, setObservacion] = useState('')
  const [coincidencias, setCoincidencias] = useState<ClientePostventaContacto[] | null>(null)
  const [buscado, setBuscado] = useState(false)

  const validar = useValidarTelefonoPostventa()
  const crear = useCrearCasoPostventa()

  const listoParaBuscar = telefono.length >= 7
  const listoParaCrear = !!tipoCaso

  async function onValidar() {
    try {
      const data = await validar.mutateAsync(telefono)
      setCoincidencias(data)
      setBuscado(true)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo validar el teléfono'))
    }
  }

  async function onElegir(clienteId: number) {
    try {
      const caso = await crear.mutateAsync({
        cliente_id: clienteId,
        tipo_caso: tipoCaso,
        telefono_contacto: telefono,
        observacion_inicial: observacion || undefined,
      })
      toast.success(`Caso #${caso.id} creado`)
      navigate(`/postventa/casos/${caso.id}`)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo crear el caso'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Validar cliente"
        description="Busca por el teléfono que dio el cliente en la llamada — el titular, su cónyuge o un beneficiario, todos matchean por los teléfonos del mismo registro."
      />

      <Card className="mx-auto max-w-xl space-y-4 p-6">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Teléfono</label>
          <Input
            value={telefono}
            onChange={(e) => {
              setTelefono(e.target.value.replace(/\D/g, '').slice(0, 15))
              setCoincidencias(null)
              setBuscado(false)
            }}
            placeholder="3051234567"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tipo de caso</label>
          <Select value={tipoCaso} onValueChange={setTipoCaso}>
            <SelectTrigger><SelectValue placeholder="Selecciona el motivo de la llamada" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Atención directa</SelectLabel>
                {CASOS_ATENCION_DIRECTA.map((t) => <SelectItem key={t.valor} value={t.valor}>{t.nombre}</SelectItem>)}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>BackOffice</SelectLabel>
                {CASOS_BACKOFFICE.map((t) => <SelectItem key={t.valor} value={t.valor}>{t.nombre}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Es informativo — igual puedes escalarlo a BackOffice más adelante si hace falta, sin importar cuál elijas acá.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Observación inicial (opcional)</label>
          <Textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} rows={3} placeholder="Lo que cuenta el cliente en la llamada..." />
        </div>

        <Button onClick={onValidar} disabled={!listoParaBuscar || validar.isPending} className="w-full">
          <Search className="size-4" />
          {validar.isPending ? 'Buscando...' : 'Validar'}
        </Button>

        {buscado && !coincidencias?.length && (
          <div className="flex gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-amber-700 dark:text-amber-400">
              No hay ningún cliente aprobado con ese teléfono. Revisa el número con el cliente.
            </p>
          </div>
        )}

        {!!coincidencias?.length && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium">
              {coincidencias.length > 1 ? `${coincidencias.length} clientes encontrados — elige el correcto:` : 'Cliente encontrado:'}
            </p>
            {!listoParaCrear && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Selecciona un tipo de caso arriba antes de continuar.</p>
            )}
            {coincidencias.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-md border bg-background p-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <UserRound className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.nombres} {c.apellidos}</p>
                    <p className="text-xs text-muted-foreground">
                      ID {c.id} · {ESTADO_CLIENTE_LABEL[c.estado]} · agente {c.agente_nombre}
                    </p>
                  </div>
                </div>
                <Button type="button" size="sm" className="shrink-0" disabled={!listoParaCrear || crear.isPending} onClick={() => onElegir(c.id)}>
                  Seleccionar
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
