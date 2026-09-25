import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Eye, FileText, Paperclip, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useSoportesCasoPostventa,
  useSubirSoporteCasoPostventa,
  useEliminarSoporteCasoPostventa,
  abrirSoporteCasoPostventa,
} from '@/hooks/soportesCasoPostventa'
import { apiErrorMessage } from '@/lib/api'

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Documentos libres del caso de postventa — sin categoría, sin límite de
 * cantidad (2026-09-25, pedido del usuario: "tanto el agente como el
 * backoffice deben poder adjuntar documentos ilimitados en gestión de
 * postventa"). `editable` habilita subir/eliminar — ya viene calculado
 * igual que el resto de GestionCasoPage.tsx (caso activo en tu cola); en
 * modo lectura (caso ya cerrado, o vista de admin) solo se puede ver.
 */
export function SoporteCasoPostventaCard({ casoId, editable }: { casoId: number; editable: boolean }) {
  const { data: soportes, isLoading } = useSoportesCasoPostventa(casoId)
  const subir = useSubirSoporteCasoPostventa(casoId)
  const eliminar = useEliminarSoporteCasoPostventa(casoId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [viendoId, setViendoId] = useState<number | null>(null)

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    try {
      await subir.mutateAsync(Array.from(files))
      toast.success(`${files.length} archivo(s) subido(s)`)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo subir el archivo'))
    }
  }

  async function borrar(id: number) {
    try {
      await eliminar.mutateAsync(id)
      toast.success('Documento eliminado')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo eliminar'))
    }
  }

  async function ver(id: number, nombreArchivo: string) {
    setViendoId(id)
    try {
      await abrirSoporteCasoPostventa(id, nombreArchivo)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo abrir el archivo'))
    } finally {
      setViendoId(null)
    }
  }

  if (!editable && !isLoading && !soportes?.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Paperclip className="size-4" /> Documentos del caso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editable && <p className="text-xs text-muted-foreground">Sin límite de cantidad. Acepta PDF, JPG y PNG, hasta 5MB cada uno.</p>}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : !soportes?.length ? (
          <p className="text-sm text-muted-foreground">Sin documentos adjuntos.</p>
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
              id={`soporte-caso-${casoId}-input`}
            />
            <Button type="button" variant="outline" size="sm" disabled={subir.isPending} onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> {subir.isPending ? 'Subiendo...' : 'Adjuntar documento'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
