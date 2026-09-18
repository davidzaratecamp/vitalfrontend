import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { FirmaDocumento } from '@/lib/types'

export const useFirmas = (clienteId: string | number | undefined) =>
  useQuery({
    queryKey: ['clientes', clienteId, 'firmas'],
    queryFn: async () => (await api.get<FirmaDocumento[]>(`/firmas/cliente/${clienteId}`)).data,
    enabled: clienteId != null,
  })

export function useEnviarFirma(clienteId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post<FirmaDocumento>(`/firmas/cliente/${clienteId}/enviar`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes', clienteId, 'firmas'] }),
  })
}

/** Refresca el estado contra FirmaCloud (polling — el webhook no le puede
 * llegar a Vital, está en una IP privada). */
export function useActualizarEstadoFirma(clienteId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.get<FirmaDocumento | null>(`/firmas/cliente/${clienteId}/estado`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes', clienteId, 'firmas'] }),
  })
}

/**
 * El PDF firmado va detrás de una ruta autenticada, igual que las
 * evidencias (ver abrirEvidencia en hooks/clientes.ts) — se pide con el
 * token y se abre como blob, no sirve un <a href> directo. La pestaña se
 * abre ANTES del fetch para no quedar como popup bloqueado.
 */
export async function abrirCartaFirmada(clienteId: number) {
  const ventana = window.open('', '_blank')
  try {
    const res = await api.get(`/firmas/cliente/${clienteId}/descargar`, { responseType: 'blob' })
    const blob = res.data as Blob
    const url = URL.createObjectURL(blob)

    if (!ventana) {
      const a = document.createElement('a')
      a.href = url
      a.download = `carta-firmada-${clienteId}.pdf`
      document.body.append(a)
      a.click()
      a.remove()
      return
    }

    ventana.document.title = `Carta firmada — cliente ${clienteId}`
    ventana.document.body.style.cssText = 'margin:0;height:100vh;display:flex;flex-direction:column;background:#525659;font-family:system-ui,sans-serif'
    ventana.document.body.innerHTML = `
      <div style="flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;background:#323639;color:#fff">
        <span style="font-size:13px">Carta CMS firmada</span>
        <a href="${url}" download="carta-firmada-${clienteId}.pdf" style="flex:0 0 auto;color:#fff;background:#4b5563;padding:6px 14px;border-radius:6px;font-size:13px;text-decoration:none">Descargar</a>
      </div>
      <div style="flex:1 1 auto;min-height:0">
        <embed src="${url}" type="application/pdf" style="width:100%;height:100%" />
      </div>
    `
  } catch (err) {
    ventana?.close()
    throw err
  }
}
