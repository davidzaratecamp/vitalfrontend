import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, ShieldCheck, IdCard } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAseguradoras,
  useCrearAseguradora,
  useActualizarAseguradora,
  useNpnProductores,
  useCrearNpnProductor,
  useActualizarNpnProductor,
} from '@/hooks/catalogos'
import { apiErrorMessage } from '@/lib/api'

function AseguradorasSection() {
  const { data: aseguradoras, isLoading } = useAseguradoras(false)
  const crear = useCrearAseguradora()
  const actualizar = useActualizarAseguradora()
  const [nombre, setNombre] = useState('')

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    try {
      await crear.mutateAsync(nombre.trim())
      toast.success('Aseguradora agregada')
      setNombre('')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function toggle(id: number, activo: boolean) {
    try {
      await actualizar.mutateAsync({ id, is_active: !activo })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Aseguradoras" description="Catálogo único usado por el Paso 5 del agente y la confirmación de BackOffice." />

      <form onSubmit={agregar} noValidate className="flex max-w-sm gap-2">
        <Input placeholder="Nombre de la aseguradora" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Button type="submit" disabled={crear.isPending}><Plus className="size-4" /> Agregar</Button>
      </form>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : !aseguradoras?.length ? (
        <EmptyState icon={ShieldCheck} title="Sin aseguradoras" />
      ) : (
        <Card className="divide-y overflow-hidden">
          {aseguradoras.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className={a.is_active ? '' : 'text-muted-foreground line-through'}>{a.nombre}</span>
              <Button variant="outline" size="sm" onClick={() => toggle(a.id, a.is_active)}>
                {a.is_active ? 'Desactivar' : 'Reactivar'}
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

function NpnProductoresSection() {
  const { data: productores, isLoading } = useNpnProductores(false)
  const crear = useCrearNpnProductor()
  const actualizar = useActualizarNpnProductor()
  const [nombre, setNombre] = useState('')
  const [npnEdits, setNpnEdits] = useState<Record<number, string>>({})

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    try {
      await crear.mutateAsync({ nombre: nombre.trim() })
      toast.success('Productor agregado')
      setNombre('')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function toggle(id: number, activo: boolean) {
    try {
      await actualizar.mutateAsync({ id, is_active: !activo })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function guardarNpn(id: number) {
    const valor = npnEdits[id]?.trim()
    try {
      await actualizar.mutateAsync({ id, npn: valor || null })
      toast.success('NPN actualizado')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Productores (NPN)" description="A quién pertenece el NPN de la venta — se elige en el Paso 5. Independiente del NPN de texto libre que llena BackOffice." />

      <form onSubmit={agregar} noValidate className="flex max-w-sm gap-2">
        <Input placeholder="Nombre del productor" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Button type="submit" disabled={crear.isPending}><Plus className="size-4" /> Agregar</Button>
      </form>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : !productores?.length ? (
        <EmptyState icon={IdCard} title="Sin productores" />
      ) : (
        <Card className="divide-y overflow-hidden">
          {productores.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
              <span className={p.is_active ? '' : 'text-muted-foreground line-through'}>{p.nombre}</span>
              <div className="flex items-center gap-2">
                <Input
                  className="h-8 w-36"
                  placeholder="Número NPN"
                  defaultValue={p.npn ?? ''}
                  onChange={(e) => setNpnEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                />
                <Button variant="outline" size="sm" onClick={() => guardarNpn(p.id)} disabled={actualizar.isPending}>
                  Guardar NPN
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggle(p.id, p.is_active)} disabled={actualizar.isPending}>
                  {p.is_active ? 'Desactivar' : 'Reactivar'}
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

export default function CatalogosPage() {
  return (
    <div className="space-y-8">
      <AseguradorasSection />
      <NpnProductoresSection />
    </div>
  )
}
