import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Eye, FileText, ShieldCheck, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSoportesPoliza, useSubirSoportePoliza, useEliminarSoportePoliza, abrirSoportePoliza } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Adjunto opcional (PDF o imagen) que BackOffice suma a un caso —
 * `tipo="poliza"` (soporte de póliza) o `tipo="rechazo"` (imagen de
 * soporte al rechazar una venta, 2026-09-22): misma tabla/ruta, se filtra
 * por tipo. `editable` habilita subir/eliminar (solo en la pantalla de
 * gestión de BackOffice); en cualquier otra vista (admin, supervisor vía
 * ClienteResumen) se muestra en modo solo lectura.
 */
export function SoportePolizaCard({
  clienteId,
  editable,
  tipo = 'poliza',
  titulo = 'Soporte de póliza',
}: {
  clienteId: number
  editable: boolean
  tipo?: 'poliza' | 'rechazo'
  titulo?: string
}) {
  const { data: todos, isLoading } = useSoportesPoliza(clienteId)
  const soportes = todos?.filter((s) => s.tipo === tipo)
  const subir = useSubirSoportePoliza(clienteId)
  const eliminar = useEliminarSoportePoliza(clienteId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [viendoId, setViendoId] = useState<number | null>(null)

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    try {
      await subir.mutateAsync({ files: Array.from(files), tipo })
      toast.success(`${files.length} archivo(s) subido(s)`)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo subir el archivo'))
    }
  }

  async function borrar(id: number) {
    try {
      await eliminar.mutateAsync(id)
      toast.success('Soporte eliminado')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo eliminar'))
    }
  }

  async function ver(id: number, nombreArchivo: string) {
    setViendoId(id)
    try {
      await abrirSoportePoliza(id, nombreArchivo)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo abrir el archivo'))
    } finally {
      setViendoId(null)
    }
  }

  // Si no hay nada que mostrar y esta vista no puede subir (solo lectura),
  // no tiene sentido ocupar espacio con la tarjeta vacía.
  if (!editable && !isLoading && !soportes?.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4" /> {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editable && (
          <p className="text-xs text-muted-foreground">
            Opcional. Acepta PDF, JPG y PNG. Máximo 5 archivos de 5MB cada uno.
          </p>
        )}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : !soportes?.length ? (
          <p className="text-sm text-muted-foreground">Sin {titulo.toLowerCase()} adjunto.</p>
        ) : (
          <div className="space-y-2">
            {soportes.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-md border p-2.5 text-sm">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.nombre_archivo}</p>
                  <p className="text-xs text-muted-foreground">{fmtBytes(s.tamano_bytes)} · {s.tipo_archivo}</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => ver(s.id, s.nombre_archivo)} disabled={viendoId === s.id}>
                  <Eye className="size-4" />
                </Button>
                {editable && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => borrar(s.id)} disabled={eliminar.isPending}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {editable && (
          <div className="rounded-lg border border-dashed p-3">
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => onFiles(e.target.files)}
              className="hidden"
              id={`soporte-${tipo}-input`}
            />
            <Button type="button" variant="outline" size="sm" disabled={subir.isPending} onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> {subir.isPending ? 'Subiendo...' : 'Adjuntar soporte'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
