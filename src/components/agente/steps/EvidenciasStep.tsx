import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Eye, FileText, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useEvidencias, useSubirEvidencias, useEliminarEvidencia, abrirEvidencia } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function EvidenciasStep({ clienteId, editable }: { clienteId: number; editable: boolean }) {
  const { data: evidencias, isLoading } = useEvidencias(clienteId)
  const subir = useSubirEvidencias(clienteId)
  const eliminar = useEliminarEvidencia(clienteId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [descripcion, setDescripcion] = useState('')
  const [viendoId, setViendoId] = useState<number | null>(null)

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    try {
      await subir.mutateAsync({ files: Array.from(files), descripcion: descripcion || undefined })
      toast.success(`${files.length} archivo(s) subido(s)`)
      setDescripcion('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo subir el archivo'))
    }
  }

  async function borrar(id: number) {
    try {
      await eliminar.mutateAsync(id)
      toast.success('Evidencia eliminada')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo eliminar'))
    }
  }

  async function ver(id: number, nombreArchivo: string) {
    setViendoId(id)
    try {
      await abrirEvidencia(id, nombreArchivo)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo abrir el archivo'))
    } finally {
      setViendoId(null)
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando...</p>

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Acepta PDF, JPG y PNG. Máximo {5} archivos de {5}MB cada uno por cliente.
      </p>

      {!!evidencias?.length && (
        <div className="space-y-2">
          {evidencias.map((e) => (
            <Card key={e.id} className="flex items-center gap-3 p-3">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{e.nombre_archivo}</p>
                <p className="text-xs text-muted-foreground">{fmtBytes(e.tamano_bytes)} · {e.tipo_archivo}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => ver(e.id, e.nombre_archivo)} disabled={viendoId === e.id}>
                <Eye className="size-4" />
              </Button>
              {editable && (
                <Button type="button" variant="ghost" size="icon" onClick={() => borrar(e.id)} disabled={eliminar.isPending}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {editable && (
        <div className="space-y-3 rounded-lg border border-dashed p-4">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => onFiles(e.target.files)}
            className="hidden"
            id="evidencias-input"
          />
          <Textarea
            rows={2}
            placeholder="Descripción de los archivos (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <Button type="button" variant="outline" size="sm" disabled={subir.isPending} onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> {subir.isPending ? 'Subiendo...' : 'Subir archivos'}
          </Button>
        </div>
      )}
    </div>
  )
}
