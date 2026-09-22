import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Circle, Eye, FileText, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useEvidencias, useSubirEvidencias, useEliminarEvidencia, abrirEvidencia } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'
import { CATEGORIA_EVIDENCIA, CATEGORIA_EVIDENCIA_LABEL, CATEGORIA_EVIDENCIA_OBLIGATORIA } from '@/lib/clienteConstants'
import type { Evidencia } from '@/lib/types'

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function Casillero({
  categoria,
  archivos,
  editable,
  onSubir,
  onEliminar,
  subiendo,
  eliminandoId,
}: {
  categoria: string
  archivos: Evidencia[]
  editable: boolean
  onSubir: (files: FileList) => void
  onEliminar: (id: number) => void
  subiendo: boolean
  eliminandoId: number | null
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [viendoId, setViendoId] = useState<number | null>(null)
  const obligatorio = (CATEGORIA_EVIDENCIA_OBLIGATORIA as readonly string[]).includes(categoria)
  const completo = archivos.length > 0

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

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium">
          {completo ? (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
          ) : (
            <Circle className="size-4 shrink-0 text-muted-foreground" />
          )}
          {CATEGORIA_EVIDENCIA_LABEL[categoria]}
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            obligatorio
              ? completo
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          {obligatorio ? (completo ? 'Completo' : 'Obligatorio — falta') : 'Opcional'}
        </span>
      </div>

      {archivos.length > 0 && (
        <div className="space-y-2">
          {archivos.map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-md border p-2 text-sm">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.nombre_archivo}</p>
                <p className="text-xs text-muted-foreground">{fmtBytes(e.tamano_bytes)}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => ver(e.id, e.nombre_archivo)} disabled={viendoId === e.id}>
                <Eye className="size-4" />
              </Button>
              {editable && (
                <Button type="button" variant="ghost" size="icon" onClick={() => onEliminar(e.id)} disabled={eliminandoId === e.id}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {editable && (
        <div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => e.target.files && onSubir(e.target.files)}
            className="hidden"
          />
          <Button type="button" variant="outline" size="sm" disabled={subiendo} onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> {subiendo ? 'Subiendo...' : archivos.length ? 'Adjuntar otro' : 'Subir archivo'}
          </Button>
        </div>
      )}
    </Card>
  )
}

export function EvidenciasStep({ clienteId, editable }: { clienteId: number; editable: boolean }) {
  const { data: evidencias, isLoading } = useEvidencias(clienteId)
  const subir = useSubirEvidencias(clienteId)
  const eliminar = useEliminarEvidencia(clienteId)
  const [subiendoCategoria, setSubiendoCategoria] = useState<string | null>(null)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)

  async function onSubir(categoria: string, files: FileList) {
    setSubiendoCategoria(categoria)
    try {
      await subir.mutateAsync({ files: Array.from(files), categoria })
      toast.success(`${files.length} archivo(s) subido(s) a ${CATEGORIA_EVIDENCIA_LABEL[categoria]}`)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo subir el archivo'))
    } finally {
      setSubiendoCategoria(null)
    }
  }

  async function onEliminar(id: number) {
    setEliminandoId(id)
    try {
      await eliminar.mutateAsync(id)
      toast.success('Evidencia eliminada')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo eliminar'))
    } finally {
      setEliminandoId(null)
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando...</p>

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Acepta PDF, JPG y PNG. Póliza, Estatus migratorio y Licencia son obligatorias para poder enviar el caso a
        BackOffice — Social es opcional.
      </p>
      {CATEGORIA_EVIDENCIA.map((cat) => (
        <Casillero
          key={cat}
          categoria={cat}
          archivos={evidencias?.filter((e) => e.categoria === cat) ?? []}
          editable={editable}
          onSubir={(files) => onSubir(cat, files)}
          onEliminar={onEliminar}
          subiendo={subiendoCategoria === cat}
          eliminandoId={eliminandoId}
        />
      ))}
      {!!evidencias?.some((e) => !e.categoria) && (
        <div className="space-y-2 rounded-lg border border-dashed p-3">
          <p className="text-xs text-muted-foreground">Sin categoría (subidas antes de este cambio):</p>
          {evidencias
            .filter((e) => !e.categoria)
            .map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-md border p-2 text-sm">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.nombre_archivo}</p>
                  <p className="text-xs text-muted-foreground">{fmtBytes(e.tamano_bytes)}</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => abrirEvidencia(e.id, e.nombre_archivo)}>
                  <Eye className="size-4" />
                </Button>
                {editable && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => onEliminar(e.id)} disabled={eliminandoId === e.id}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
