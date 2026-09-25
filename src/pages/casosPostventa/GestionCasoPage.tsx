import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { User, Users, Baby, DollarSign, HeartHandshake, CreditCard, FileText, History, Save, CircleCheck, Forward, PhoneCall } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { FirmaCartaCard } from '@/components/common/FirmaCartaCard'
import { ObservacionesCard } from '@/components/common/ObservacionesCard'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CopyableId } from '@/components/common/CopyableId'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { StepStatus } from '@/components/agente/FormField'
import { TitularStep } from '@/components/agente/steps/TitularStep'
import { ConyugeStep } from '@/components/agente/steps/ConyugeStep'
import { DependientesStep } from '@/components/agente/steps/DependientesStep'
import { IngresosStep } from '@/components/agente/steps/IngresosStep'
import { PlanSaludStep } from '@/components/agente/steps/PlanSaludStep'
import { PagoStep } from '@/components/agente/steps/PagoStep'
import { EvidenciasStep } from '@/components/agente/steps/EvidenciasStep'
import { SoporteCasoPostventaCard } from '@/components/casosPostventa/SoporteCasoPostventaCard'
import { NumeroTarjetaReveal, DataPointReveal } from '@/components/common/DatosTarjetaReveal'
import { useCliente, useConyuge, useDependientes, useIngresos, usePlanSalud, usePago, useEvidencias } from '@/hooks/clientes'
import { useCasoPostventa, useHistorialCasoPostventa, useActualizarCasoPostventa } from '@/hooks/casosPostventa'
import { apiErrorMessage } from '@/lib/api'
import { TIPO_CASO_POSTVENTA_LABEL, TIPO_GESTION_POSTVENTA, TIPO_GESTION_POSTVENTA_LABEL, ESTADO_CASO_POSTVENTA_LABEL, ESTADO_CASO_POSTVENTA_COLOR } from '@/lib/casosPostventaConstants'
import { fmtDateTime } from '@/lib/dateFormat'
import { useAuthStore } from '@/stores/auth'

/**
 * Página compartida por Agente (pestaña Postventa, 2026-09-24: "el
 * customer es el mismo agente") y BackOffice ("Postventa") para gestionar
 * un caso — reusa el mismo acordeón de 7 pasos del formulario de venta,
 * ahora habilitado para editar un cliente ya APROBADO (sea o no el que lo
 * vendió). El servidor es quien de verdad decide si se puede escribir
 * (assertCanEdit exige un caso activo para este cliente en el estado
 * correcto para el rol) — `editable` acá solo refleja esa misma regla para
 * no mostrar campos editables que el backend igual va a rechazar.
 */
export default function GestionCasoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.user?.role)

  const { data: caso, isLoading: cargandoCaso } = useCasoPostventa(id)
  const { data: cliente, isLoading: cargandoCliente } = useCliente(caso?.cliente_id)
  const { data: historial } = useHistorialCasoPostventa(id)
  const actualizar = useActualizarCasoPostventa(id ?? 0)

  const conyuge = useConyuge(caso?.cliente_id)
  const dependientes = useDependientes(caso?.cliente_id)
  const ingresos = useIngresos(caso?.cliente_id)
  const plan = usePlanSalud(caso?.cliente_id)
  const pago = usePago(caso?.cliente_id)
  const evidencias = useEvidencias(caso?.cliente_id)

  const [open, setOpen] = useState('titular')
  const [tipoGestion, setTipoGestion] = useState('')
  const [motivo, setMotivo] = useState('')
  const [confirmEscalar, setConfirmEscalar] = useState(false)

  if (cargandoCaso || !caso || cargandoCliente || !cliente) return <Skeleton className="h-96 rounded-xl" />

  const clienteId = cliente.id
  const activoParaMi =
    (role === 'agente' && (caso.estado === 'nuevo' || caso.estado === 'seguimiento')) ||
    (role === 'backoffice' && caso.estado === 'escalado_backoffice')
  const editable = activoParaMi
  const ingresoTitularOk = ingresos.data?.rows.some((r) => r.dependiente_id == null)
  const tipoGestionAEnviar = tipoGestion || caso.tipo_gestion || undefined

  async function guardar(estado: string) {
    try {
      await actualizar.mutateAsync({ estado, tipo_gestion: tipoGestionAEnviar, motivo: motivo || undefined })
      toast.success(
        estado === 'cerrado' ? 'Caso cerrado' : estado === 'escalado_backoffice' ? 'Caso escalado a BackOffice' : 'Caso guardado'
      )
      setConfirmEscalar(false)
      navigate(role === 'backoffice' ? '/postventa' : '/postventa/por-gestionar')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo actualizar el caso'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${cliente.nombres} ${cliente.apellidos}`}
        description={TIPO_CASO_POSTVENTA_LABEL[caso.tipo_caso] ?? caso.tipo_caso}
        actions={
          <>
            <CopyableId id={caso.id} className="bg-primary/10 text-primary" />
            <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${ESTADO_CASO_POSTVENTA_COLOR[caso.estado]}`}>
              {ESTADO_CASO_POSTVENTA_LABEL[caso.estado]}
            </span>
          </>
        }
      />

      {!editable && (
        <Card className="border-muted-foreground/20 bg-muted/30 p-4 text-sm text-muted-foreground">
          {role === 'admin'
            ? 'Vista de solo lectura — admin no gestiona casos de postventa, solo los supervisa.'
            : 'Este caso ya no está activo en tu cola — puedes revisarlo, pero no editarlo.'}
        </Card>
      )}

      {/* Lo que se registró al validar la llamada — antes se guardaba pero
          nunca se mostraba en ninguna pantalla (2026-09-24, reportado por
          el usuario: "mandé un caso al backoffice pero no veo el
          comentario del customer desde el back"). */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><PhoneCall className="size-4" /> Contexto de la llamada</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Teléfono de contacto:</span> <span className="font-medium">{caso.telefono_contacto}</span></p>
          <p>
            <span className="text-muted-foreground">Observación inicial:</span>{' '}
            {caso.observacion_inicial ? caso.observacion_inicial : <span className="text-muted-foreground">— sin observación —</span>}
          </p>
        </CardContent>
      </Card>

      <ObservacionesCard clienteId={clienteId} observaciones={cliente.observaciones} />

      <Accordion type="single" collapsible value={open} onValueChange={(v) => setOpen(v)}>
        <AccordionItem value="titular">
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><User className="size-4" /> 1 · Datos personales del titular</span>
              <StepStatus status="completo" />
            </span>
          </AccordionTrigger>
          <AccordionContent><TitularStep cliente={cliente} editable={editable} /></AccordionContent>
        </AccordionItem>

        <AccordionItem value="conyuge">
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><HeartHandshake className="size-4" /> 2 · Cónyuge</span>
              <StepStatus status={conyuge.data ? 'completo' : 'vacio'} />
            </span>
          </AccordionTrigger>
          <AccordionContent><ConyugeStep clienteId={clienteId} editable={editable} /></AccordionContent>
        </AccordionItem>

        <AccordionItem value="dependientes">
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><Baby className="size-4" /> 3 · Dependientes</span>
              <StepStatus status={dependientes.data?.length ? 'completo' : 'vacio'} />
            </span>
          </AccordionTrigger>
          <AccordionContent><DependientesStep clienteId={clienteId} editable={editable} /></AccordionContent>
        </AccordionItem>

        <AccordionItem value="ingresos">
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><DollarSign className="size-4" /> 4 · Ingresos</span>
              <StepStatus status={ingresoTitularOk ? 'completo' : 'vacio'} />
            </span>
          </AccordionTrigger>
          <AccordionContent><IngresosStep clienteId={clienteId} editable={editable} /></AccordionContent>
        </AccordionItem>

        <AccordionItem value="plan">
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><Users className="size-4" /> 5 · Plan de salud cotizado</span>
              <StepStatus status={plan.data ? 'completo' : 'vacio'} />
            </span>
          </AccordionTrigger>
          <AccordionContent><PlanSaludStep clienteId={clienteId} editable={editable} estado={cliente.estado_us} /></AccordionContent>
        </AccordionItem>

        <AccordionItem value="pago">
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><CreditCard className="size-4" /> 6 · Información de pago</span>
              <StepStatus status={pago.data ? 'completo' : 'vacio'} />
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <PagoStep clienteId={clienteId} editable={editable} primaEsCero={plan.data != null && Number(plan.data.valor_prima) === 0} />
            {/* Antes solo existían en ClienteResumen.tsx — un caso de
                postventa (donde se revisan clientes YA aprobados, el
                escenario típico para pedir estos datos) no tenía forma de
                pedirlos (2026-09-25, reportado por el usuario). */}
            {(pago.data?.ultimos_4_digitos || pago.data?.ultimos_4_cuenta || pago.data?.tiene_data_point) && (
              <div className="flex flex-wrap gap-3 border-t pt-3">
                {(pago.data?.ultimos_4_digitos || pago.data?.ultimos_4_cuenta) && <NumeroTarjetaReveal clienteId={clienteId} />}
                {pago.data?.tiene_data_point && <DataPointReveal clienteId={clienteId} />}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <FirmaCartaCard
        clienteId={clienteId}
        correoCliente={cliente.correo_electronico}
        telefonoCliente={cliente.phone_1}
        whatsappCliente={cliente.whatsapp}
      />

      <Accordion type="single" collapsible value={open} onValueChange={(v) => setOpen(v)}>
        <AccordionItem value="evidencias">
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><FileText className="size-4" /> 7 · Evidencias</span>
              <StepStatus status={evidencias.data?.length ? 'completo' : 'vacio'} />
            </span>
          </AccordionTrigger>
          <AccordionContent><EvidenciasStep clienteId={clienteId} editable={editable} /></AccordionContent>
        </AccordionItem>
      </Accordion>

      <SoporteCasoPostventaCard casoId={caso.id} editable={editable} />

      {editable && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cerrar gestión de este caso</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tipo de gestión</label>
                <Select value={tipoGestion || caso.tipo_gestion || ''} onValueChange={setTipoGestion}>
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {TIPO_GESTION_POSTVENTA.map((t) => <SelectItem key={t} value={t}>{TIPO_GESTION_POSTVENTA_LABEL[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nota (opcional)</label>
                <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={1} placeholder="Qué se hizo, qué falta..." />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {role === 'agente' && (
                <Button variant="outline" disabled={actualizar.isPending} onClick={() => guardar('seguimiento')}>
                  <Save className="size-4" /> Guardar y dejar en seguimiento
                </Button>
              )}
              <Button disabled={actualizar.isPending} onClick={() => guardar('cerrado')}>
                <CircleCheck className="size-4" /> {role === 'backoffice' ? 'Cerrar caso' : 'Guardar y cerrar'}
              </Button>
              {role === 'agente' && (
                <Button variant="secondary" disabled={actualizar.isPending} onClick={() => setConfirmEscalar(true)}>
                  <Forward className="size-4" /> Pasar a BackOffice
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="size-4" /> Historial del caso</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {!historial?.length && <p className="text-sm text-muted-foreground">Sin movimientos todavía.</p>}
          {historial?.map((h) => (
            <div key={h.id} className="flex justify-between text-sm">
              <span>
                {h.estado_anterior ? `${ESTADO_CASO_POSTVENTA_LABEL[h.estado_anterior]} → ` : ''}
                <span className="font-medium">{ESTADO_CASO_POSTVENTA_LABEL[h.estado_nuevo]}</span>
                {h.motivo && <span className="text-muted-foreground"> · {h.motivo}</span>}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {h.cambiado_por_nombre} · {fmtDateTime(h.created_at)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmEscalar}
        onOpenChange={setConfirmEscalar}
        title="¿Pasar este caso a BackOffice?"
        description="BackOffice lo tomará desde su cola de Postventa. Ya no vas a poder seguir editándolo desde tu cola."
        confirmLabel="Pasar a BackOffice"
        loading={actualizar.isPending}
        onConfirm={() => guardar('escalado_backoffice')}
      />
    </div>
  )
}
