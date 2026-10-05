import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { History, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { ClienteResumen } from '@/components/common/ClienteResumen'
import { CopyableId } from '@/components/common/CopyableId'
import { SoportePolizaCard } from '@/components/common/SoportePolizaCard'
import { GrabacionesCard } from '@/components/common/GrabacionesCard'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCliente, useEliminarCliente } from '@/hooks/clientes'
import { useAuthStore } from '@/stores/auth'
import { apiErrorMessage } from '@/lib/api'
import { ESTADO_CLIENTE_LABEL, ESTADO_CLIENTE_COLOR } from '@/lib/clienteConstants'
import { fmtDateTime } from '@/lib/dateFormat'

export default function ClienteDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: cliente, isLoading } = useCliente(id)
  const eliminar = useEliminarCliente()
  const role = useAuthStore((s) => s.user?.role)
  const esAdmin = role === 'admin'
  const [confirmBorrar, setConfirmBorrar] = useState(false)
  const [observacion, setObservacion] = useState('')

  if (isLoading || !cliente) return <Skeleton className="h-96 rounded-xl" />

  // supervisor: solo puede eliminar borradores (el backend lo exige, este
  // botón evita ofrecer algo que igual va a rechazar). admin: cualquier
  // estado (2026-09-29, pedido del usuario) — pasa por un diálogo propio
  // con observación opcional en vez del ConfirmDialog genérico.
  const puedeEliminar = esAdmin || cliente.estado === 'borrador'

  async function onEliminar() {
    if (!id) return
    try {
      await eliminar.mutateAsync({ id, observacion: observacion.trim() || undefined })
      toast.success('Registro eliminado')
      navigate('/')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo eliminar'))
    }
  }

  function abrirConfirmacion() {
    setObservacion('')
    setConfirmBorrar(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${cliente.nombres} ${cliente.apellidos}`}
        description="Vista 360 — solo lectura."
        actions={
          <>
            {puedeEliminar && (
              <Button type="button" variant="ghost" size="sm" onClick={abrirConfirmacion}>
                <Trash2 className="size-4 text-destructive" /> {esAdmin ? 'Eliminar ID' : 'Eliminar borrador'}
              </Button>
            )}
            <CopyableId id={cliente.id} />
            <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${ESTADO_CLIENTE_COLOR[cliente.estado]}`}>
              {ESTADO_CLIENTE_LABEL[cliente.estado]}
            </span>
          </>
        }
      />

      <ClienteResumen c={cliente} />

      <GrabacionesCard origen={{ clienteId: cliente.id }} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SoportePolizaCard clienteId={cliente.id} editable={false} />
        <SoportePolizaCard clienteId={cliente.id} editable={false} tipo="rechazo" titulo="Soporte del rechazo" />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="size-4" /> Historial de estados</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {cliente.historial.map((h) => (
            <div key={h.id} className="flex justify-between text-sm">
              <span>
                {h.estado_anterior ? `${ESTADO_CLIENTE_LABEL[h.estado_anterior]} → ` : ''}
                <span className="font-medium">{ESTADO_CLIENTE_LABEL[h.estado_nuevo]}</span>
                {h.motivo && <span className="text-muted-foreground"> · {h.motivo}</span>}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {h.cambiado_por_nombre} · {fmtDateTime(h.created_at)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {esAdmin ? (
        // Diálogo propio (no ConfirmDialog genérico) porque acá sí hace
        // falta capturar la observación opcional — el ConfirmDialog no
        // tiene un slot para contenido entre la descripción y los botones.
        <Dialog open={confirmBorrar} onOpenChange={setConfirmBorrar}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>¿Eliminar este ID?</DialogTitle>
              <DialogDescription>
                Se va a borrar por completo — {ESTADO_CLIENTE_LABEL[cliente.estado]}, con todo lo que se haya guardado
                (dependientes, evidencias, etc). No se puede deshacer. Queda registrado en la Papelera con tu usuario,
                fecha/hora e IP.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="observacion-borrado">Observación (opcional)</Label>
              <Textarea
                id="observacion-borrado"
                placeholder="Motivo de la eliminación, si aplica..."
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmBorrar(false)} disabled={eliminar.isPending}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={onEliminar} disabled={eliminar.isPending}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <ConfirmDialog
          open={confirmBorrar}
          onOpenChange={setConfirmBorrar}
          title="¿Eliminar este borrador?"
          description="Se va a borrar por completo, con todo lo que se haya guardado (dependientes, evidencias, etc). No se puede deshacer."
          confirmLabel="Eliminar"
          destructive
          loading={eliminar.isPending}
          onConfirm={onEliminar}
        />
      )}
    </div>
  )
}
