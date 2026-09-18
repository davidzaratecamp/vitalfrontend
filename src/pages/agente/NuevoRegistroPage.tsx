import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, User, Users, Baby, DollarSign, HeartHandshake, CreditCard, FileText } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { FirmaCartaCard } from '@/components/common/FirmaCartaCard'
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
import { useCliente, useConyuge, useDependientes, useIngresos, usePlanSalud, usePago, useEvidencias, useFinalizar } from '@/hooks/clientes'
import { useAseguradorasPorEstado } from '@/hooks/catalogos'
import { apiErrorMessage } from '@/lib/api'
import { ESTADO_CLIENTE_LABEL, ESTADO_CLIENTE_COLOR } from '@/lib/clienteConstants'

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
  const finalizar = useFinalizar(id ?? 0)
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

  async function onFinalizar() {
    try {
      await finalizar.mutateAsync()
      toast.success(cliente?.estado === 'rechazado_backoffice' ? 'Reenviado a BackOffice' : 'Enviado a BackOffice')
      navigate('/')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Faltan pasos por completar'))
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
            <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${ESTADO_CLIENTE_COLOR[cliente.estado]}`}>
              {ESTADO_CLIENTE_LABEL[cliente.estado]}
            </span>
          )
        }
      />

      {cliente?.estado === 'rechazado_backoffice' && (
        <Card className="border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          Este registro fue devuelto por BackOffice. Corrige los pasos necesarios y presiona
          «Reenviar a BackOffice» al final.
        </Card>
      )}

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
              <StepStatus status={pago.data ? 'completo' : 'vacio'} />
            </span>
          </AccordionTrigger>
          <AccordionContent>{clienteId && <PagoStep clienteId={clienteId} editable={editable} />}</AccordionContent>
        </AccordionItem>

        <AccordionItem value="evidencias" disabled={!clienteId}>
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2"><FileText className="size-4" /> 7 · Evidencias</span>
              <StepStatus status={evidencias.data?.length ? 'completo' : 'vacio'} />
            </span>
          </AccordionTrigger>
          <AccordionContent>{clienteId && <EvidenciasStep clienteId={clienteId} editable={editable} />}</AccordionContent>
        </AccordionItem>
      </Accordion>

      {clienteId && <FirmaCartaCard clienteId={clienteId} correoCliente={cliente?.correo_electronico} />}

      {editable && clienteId && (
        <Card className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Cuando todos los pasos estén listos, finaliza para enviarlo a BackOffice.
          </p>
          <Button onClick={onFinalizar} disabled={finalizar.isPending}>
            <CheckCircle2 className="size-4" />
            {finalizar.isPending ? 'Enviando...' : cliente?.estado === 'rechazado_backoffice' ? 'Reenviar a BackOffice' : 'Finalizar y enviar a BackOffice'}
          </Button>
        </Card>
      )}
    </div>
  )
}
