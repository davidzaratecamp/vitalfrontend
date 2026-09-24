import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, User, Users, Baby, DollarSign, HeartHandshake, CreditCard, FileText, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { FirmaCartaCard } from '@/components/common/FirmaCartaCard'
import { ObservacionesCard } from '@/components/common/ObservacionesCard'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { StepStatus } from '@/components/agente/FormField'
import { ValidacionContacto } from '@/components/agente/ValidacionContacto'
import { TitularStep } from '@/components/agente/steps/TitularStep'
import { ConyugeStep } from '@/components/agente/steps/ConyugeStep'
import { DependientesStep } from '@/components/agente/steps/DependientesStep'
import { IngresosStep } from '@/components/agente/steps/IngresosStep'
import { PlanSaludStep } from '@/components/agente/steps/PlanSaludStep'
import { PagoStep } from '@/components/agente/steps/PagoStep'
import { EvidenciasStep } from '@/components/agente/steps/EvidenciasStep'
import { useCliente, useConyuge, useDependientes, useIngresos, usePlanSalud, usePago, useEvidencias, useFinalizar, useEliminarCliente } from '@/hooks/clientes'
import { useFirmas } from '@/hooks/firmas'
import { useAseguradorasPorEstado } from '@/hooks/catalogos'
import { apiErrorMessage } from '@/lib/api'
import { ESTADO_CLIENTE_LABEL, ESTADO_CLIENTE_COLOR, CATEGORIA_EVIDENCIA_OBLIGATORIA } from '@/lib/clienteConstants'

export default function NuevoRegistroPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: cliente, isLoading } = useCliente(id)
  const [open, setOpen] = useState('titular')
  // La compuerta solo aplica al crear (sin :id en la URL) — corregir un
  // registro existente (con :id) nunca pasa por acá.
  const [gatePassed, setGatePassed] = useState(() => !!id)
  const [datosIniciales, setDatosIniciales] = useState<{ phone_1: string } | undefined>()
  // Se llena apenas el agente elige un estado en el Paso 1 — antes incluso
  // de guardarlo — así el Paso 5 puede mostrar cobertura "desde el minuto
  // 1". Si se reabre un cliente ya guardado, arranca con su estado real.
  const [estadoElegido, setEstadoElegido] = useState('')

  const conyuge = useConyuge(id)
  const dependientes = useDependientes(id)
  const ingresos = useIngresos(id)
  const plan = usePlanSalud(id)
  const pago = usePago(id)
  const evidencias = useEvidencias(id)
  // clienteId numérico, no el `id` de la URL (string) — FirmaCartaCard usa
  // useFirmas(clienteId) con ese mismo número; si acá se usara el string,
  // sería una entrada de caché DISTINTA y nunca se enteraría cuando
  // FirmaCartaCard invalida su propia query al actualizar el estado (bug
  // real: la carta mostraba "Firmada" pero este mensaje seguía diciendo
  // que faltaba firmar, porque leía una copia en caché que nunca se
  // refrescó).
  const firmas = useFirmas(cliente?.id)
  const finalizar = useFinalizar(id ?? 0)
  const eliminar = useEliminarCliente()
  const [confirmBorrar, setConfirmBorrar] = useState(false)
  // Todos los hooks van antes de los `return` de abajo — si no, React se
  // queja (con razón: el orden de hooks no puede depender de una condición).
  const estadoActivo = cliente?.estado_us || estadoElegido
  const cobertura = useAseguradorasPorEstado(estadoActivo)

  if (id && isLoading) return <p className="text-sm text-muted-foreground">Cargando registro...</p>

  if (!id && !gatePassed) {
    return (
      <div className="space-y-6">
        <PageHeader title="Nuevo registro" description="Primero valida que el cliente no esté ya registrado." />
        <ValidacionContacto
          onNuevo={(datos) => {
            setDatosIniciales(datos)
            setGatePassed(true)
          }}
        />
      </div>
    )
  }

  const editable = !cliente || cliente.estado === 'borrador' || cliente.estado === 'rechazado_backoffice'
  const clienteId = cliente?.id

  const ingresoTitularOk = ingresos.data?.rows.some((r) => r.dependiente_id == null)
  // "Subir venta" (Finalizar) exige que el cliente ya haya firmado la carta
  // — el agente usa el botón "Actualizar estado" de FirmaCartaCard para
  // refrescar esto (el webhook no le puede llegar a Vital). El backend
  // también lo exige (finalizar() en clientes.service.js), esto es solo
  // para no ofrecer un botón que va a fallar.
  const firmaFirmada = firmas.data?.[0]?.estado === 'signed'
  // Póliza/Estatus migratorio/Licencia son obligatorias (Social no) — el
  // backend también lo exige en finalizar(), esto es solo para el badge.
  const evidenciasOk = CATEGORIA_EVIDENCIA_OBLIGATORIA.every((cat) =>
    evidencias.data?.some((e) => e.categoria === cat)
  )
  // Con prima $0 (plan totalmente subsidiado) no hay cobro que gestionar —
  // el Paso 6 deja de ser obligatorio para poder finalizar (2026-09-22). El
  // backend aplica la misma regla en finalizar().
  const primaEsCero = plan.data != null && Number(plan.data.valor_prima) === 0

  async function onFinalizar() {
    try {
      await finalizar.mutateAsync()
      toast.success(cliente?.estado === 'rechazado_backoffice' ? 'Reenviado a BackOffice' : 'Enviado a BackOffice')
      navigate('/')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Faltan pasos por completar'))
    }
  }

  async function onEliminar() {
    if (!clienteId) return
    try {
      await eliminar.mutateAsync(clienteId)
      toast.success('Borrador eliminado')
      navigate('/')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo eliminar'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={cliente ? `${cliente.nombres} ${cliente.apellidos}` : 'Nuevo registro'}
        description={
          cliente?.estado === 'rechazado_backoffice'
            ? 'BackOffice rechazó este registro — corrige lo necesario y reenvía.'
            : 'Completa los 7 pasos. Cada paso se guarda por separado; puedes cerrar y continuar luego.'
        }
        actions={
          cliente && (
            <>
              {cliente.estado === 'borrador' && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmBorrar(true)}>
                  <Trash2 className="size-4 text-destructive" /> Eliminar borrador
                </Button>
              )}
              <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${ESTADO_CLIENTE_COLOR[cliente.estado]}`}>
                {ESTADO_CLIENTE_LABEL[cliente.estado]}
              </span>
            </>
          )
        }
      />

      {cliente?.estado === 'rechazado_backoffice' && (
        <Card className="border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          Este registro fue devuelto por BackOffice. Corrige los pasos necesarios y presiona
          «Reenviar a BackOffice» al final.
        </Card>
      )}

      {clienteId && <ObservacionesCard clienteId={clienteId} observaciones={cliente?.observaciones ?? []} />}

      <Accordion type="single" collapsible value={open} onValueChange={(v) => setOpen(v)}>
        <AccordionItem value="titular">
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><User className="size-4" /> 1 · Datos personales del titular</span>
              <StepStatus status={cliente ? 'completo' : 'vacio'} />
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <TitularStep
              cliente={cliente}
              editable={editable}
              prellenar={datosIniciales}
              onCreated={(newId) => navigate(`/clientes/${newId}/editar`, { replace: true })}
              onEstadoChange={setEstadoElegido}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="conyuge" disabled={!clienteId}>
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><HeartHandshake className="size-4" /> 2 · Cónyuge</span>
              <StepStatus status={conyuge.data ? 'completo' : 'vacio'} />
            </span>
          </AccordionTrigger>
          <AccordionContent>{clienteId && <ConyugeStep clienteId={clienteId} editable={editable} />}</AccordionContent>
        </AccordionItem>

        <AccordionItem value="dependientes" disabled={!clienteId}>
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><Baby className="size-4" /> 3 · Dependientes</span>
              <StepStatus status={dependientes.data?.length ? 'completo' : 'vacio'} />
            </span>
          </AccordionTrigger>
          <AccordionContent>{clienteId && <DependientesStep clienteId={clienteId} editable={editable} />}</AccordionContent>
        </AccordionItem>

        <AccordionItem value="ingresos" disabled={!clienteId}>
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><DollarSign className="size-4" /> 4 · Ingresos</span>
              <StepStatus status={ingresoTitularOk ? 'completo' : 'vacio'} />
            </span>
          </AccordionTrigger>
          <AccordionContent>{clienteId && <IngresosStep clienteId={clienteId} editable={editable} />}</AccordionContent>
        </AccordionItem>

        <AccordionItem value="plan" disabled={!estadoActivo}>
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><Users className="size-4" /> 5 · Plan de salud cotizado</span>
              <span className="flex items-center gap-2">
                {estadoActivo && (
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                      cobertura.data?.length
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {cobertura.data?.length ? `${cobertura.data.length} aseguradoras disponibles` : 'Sin cobertura definida'}
                  </span>
                )}
                <StepStatus status={plan.data ? 'completo' : 'vacio'} />
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <PlanSaludStep clienteId={clienteId} editable={editable} estado={estadoActivo} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pago" disabled={!clienteId}>
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><CreditCard className="size-4" /> 6 · Información de pago</span>
              <StepStatus status={pago.data || primaEsCero ? 'completo' : 'vacio'} />
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {clienteId && <PagoStep clienteId={clienteId} editable={editable} primaEsCero={primaEsCero} />}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* La carta de firma va ANTES de las evidencias (2026-09-22, a pedido
          del usuario) — antes quedaba al final de la página, después de
          los 7 pasos, así que el agente terminaba subiendo documentos de
          ventas que ni siquiera se habían firmado todavía. Enviarla/
          revisarla acá, justo después del Plan y el Pago (de donde sale el
          contenido de la carta), deja que se envíe temprano y se monitoree
          en tiempo real mientras se reúnen los documentos por separado. */}
      {clienteId && (
        <FirmaCartaCard
          clienteId={clienteId}
          correoCliente={cliente?.correo_electronico}
          telefonoCliente={cliente?.phone_1}
          whatsappCliente={cliente?.whatsapp}
        />
      )}

      <Accordion type="single" collapsible value={open} onValueChange={(v) => setOpen(v)}>
        <AccordionItem value="evidencias" disabled={!clienteId}>
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><FileText className="size-4" /> 7 · Evidencias</span>
              <StepStatus status={evidenciasOk ? 'completo' : 'vacio'} />
            </span>
          </AccordionTrigger>
          <AccordionContent>{clienteId && <EvidenciasStep clienteId={clienteId} editable={editable} />}</AccordionContent>
        </AccordionItem>
      </Accordion>

      {editable && clienteId && (
        <Card className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {firmaFirmada
              ? 'Cuando todos los pasos estén listos, finaliza para enviarlo a BackOffice.'
              : 'Falta que el cliente firme la carta (CMS) — usa "Actualizar estado" arriba apenas firme, para poder finalizar.'}
          </p>
          <Button onClick={onFinalizar} disabled={finalizar.isPending || !firmaFirmada}>
            <CheckCircle2 className="size-4" />
            {finalizar.isPending ? 'Enviando...' : cliente?.estado === 'rechazado_backoffice' ? 'Reenviar a BackOffice' : 'Finalizar y enviar a BackOffice'}
          </Button>
        </Card>
      )}

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
    </div>
  )
}
