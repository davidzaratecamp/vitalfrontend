import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, History } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { ClienteResumen } from '@/components/common/ClienteResumen'
import { CopyableId } from '@/components/common/CopyableId'
import { SoportePolizaCard } from '@/components/common/SoportePolizaCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCliente } from '@/hooks/clientes'
import { useAseguradoras } from '@/hooks/catalogos'
import { useCompletar, useRechazar, useHistorialBackoffice } from '@/hooks/backoffice'
import { apiErrorMessage } from '@/lib/api'
import { ESTADO_CLIENTE_LABEL, ESTADO_CLIENTE_COLOR, ESTADO_PRIMA } from '@/lib/clienteConstants'
import { fmtDateTime } from '@/lib/dateFormat'

export default function GestionClientePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: cliente, isLoading } = useCliente(id)
  const { data: aseguradoras } = useAseguradoras()
  const { data: historial } = useHistorialBackoffice(id)
  const completar = useCompletar(id ?? 0)
  const rechazar = useRechazar(id ?? 0)

  const [form, setForm] = useState({ aseguradora_id: '', nombre_plan: '', deducible: '', gasto_max_bolsillo: '', npn: '', estado_prima: '' })
  const [motivo, setMotivo] = useState('')
  const [confirmRechazo, setConfirmRechazo] = useState(false)

  // El agente ya cargó estos datos en el Paso 5 — no hace falta que
  // BackOffice los vuelva a escribir, solo revisarlos. El NPN se
  // precarga con el número real del productor elegido (npn_productor_npn);
  // "Estado de la prima" es la única decisión que le corresponde tomar a
  // BackOffice, esa siempre arranca en blanco.
  const plan = cliente?.plan_salud
  useEffect(() => {
    if (!plan) return
    setForm((f) => ({
      ...f,
      aseguradora_id: f.aseguradora_id || String(plan.aseguradora_id),
      nombre_plan: f.nombre_plan || plan.nombre_plan,
      deducible: f.deducible || (plan.deducible ?? ''),
      gasto_max_bolsillo: f.gasto_max_bolsillo || (plan.gasto_max_bolsillo ?? ''),
      npn: f.npn || plan.npn_productor_npn || plan.npn || '',
    }))
  }, [plan])

  if (isLoading || !cliente) return <Skeleton className="h-96 rounded-xl" />

  const pendiente = cliente.estado === 'pendiente_backoffice'
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function onCompletar(e: React.FormEvent) {
    e.preventDefault()
    try {
      await completar.mutateAsync({
        aseguradora_id: Number(form.aseguradora_id),
        nombre_plan: form.nombre_plan,
        deducible: Number(form.deducible),
        gasto_max_bolsillo: Number(form.gasto_max_bolsillo),
        npn: form.npn,
        estado_prima: form.estado_prima,
      })
      toast.success('Venta aprobada')
      navigate('/')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Completa los 6 campos de póliza'))
    }
  }

  async function onRechazar() {
    try {
      await rechazar.mutateAsync(motivo)
      toast.success('Registro rechazado, vuelve al agente')
      setConfirmRechazo(false)
      navigate('/')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${cliente.nombres} ${cliente.apellidos}`}
        description={`Enviado por ${cliente.agente?.name ?? '—'}`}
        actions={
          <>
            <CopyableId id={cliente.id} />
            <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${ESTADO_CLIENTE_COLOR[cliente.estado]}`}>
              {ESTADO_CLIENTE_LABEL[cliente.estado]}
            </span>
          </>
        }
      />

      <ClienteResumen c={cliente} />

      {pendiente && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cerrar gestión de la venta</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={onCompletar} noValidate className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Aseguradora</label>
                  <Select value={form.aseguradora_id} onValueChange={(v) => set('aseguradora_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>{aseguradoras?.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nombre del plan</label>
                  <Input value={form.nombre_plan} onChange={(e) => set('nombre_plan', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Deducible (USD)</label>
                  <Input type="number" min={0} step="0.01" value={form.deducible} onChange={(e) => set('deducible', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Gasto máximo de bolsillo (USD)</label>
                  <Input type="number" min={0} step="0.01" value={form.gasto_max_bolsillo} onChange={(e) => set('gasto_max_bolsillo', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">NPN</label>
                  <Input value={form.npn} onChange={(e) => set('npn', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Estado de la prima</label>
                  <Select value={form.estado_prima} onValueChange={(v) => set('estado_prima', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>{ESTADO_PRIMA.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={completar.isPending}>
                  <CheckCircle2 className="size-4" /> {completar.isPending ? 'Aprobando...' : 'Completar y aprobar'}
                </Button>
                <Button type="button" variant="destructive" onClick={() => setConfirmRechazo(true)}>
                  <XCircle className="size-4" /> Rechazar
                </Button>
              </div>
            </form>

            {confirmRechazo && (
              <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <label className="text-sm font-medium">Motivo del rechazo</label>
                <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Explica qué debe corregir el agente..." />
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" disabled={motivo.trim().length < 4 || rechazar.isPending} onClick={onRechazar}>
                    {rechazar.isPending ? 'Rechazando...' : 'Confirmar rechazo'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmRechazo(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <SoportePolizaCard clienteId={cliente.id} editable />
        <SoportePolizaCard clienteId={cliente.id} editable tipo="rechazo" titulo="Soporte del rechazo" />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="size-4" /> Historial</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {historial?.map((h) => (
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
    </div>
  )
}
