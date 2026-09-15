import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAseguradoras, useCrearAseguradora, useActualizarAseguradora } from '@/hooks/catalogos'
import { apiErrorMessage } from '@/lib/api'

export default function CatalogosPage() {
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
    <div className="space-y-6">
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
