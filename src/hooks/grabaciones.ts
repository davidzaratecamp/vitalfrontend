import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Grabacion {
  /** Id de la llamada en la central de Aware (ej. "1791225214.14890"). */
  uniqueid: string
  proyecto_id: number
  fecha: string
  hora: string
  telefono: string
  duracion: number
  campana: string | null
  agente: string | null
  /** false = intento que Aware no dejó en su registro de gestión (solo en la central). */
  registrada: boolean
}

export interface GrabacionesRespuesta {
  llamadas: Grabacion[]
  motivo: string | null
}

/** De dónde salen las grabaciones: un cliente (venta) o un caso de postventa. */
export type OrigenGrabaciones = { clienteId: number } | { casoId: number }

function basePath(origen: OrigenGrabaciones) {
  return 'clienteId' in origen ? `/grabaciones/cliente/${origen.clienteId}` : `/grabaciones/caso-postventa/${origen.casoId}`
}

/** Llamadas del agente del caso a los teléfonos del cliente, en vivo desde Aware. */
export const useGrabaciones = (origen: OrigenGrabaciones) =>
  useQuery({
    queryKey: ['grabaciones', origen],
    queryFn: async () => (await api.get<GrabacionesRespuesta>(basePath(origen))).data,
    staleTime: 60_000,
  })

/** Descarga el audio (MP3 ya convertido por el backend) y devuelve una URL local para <audio>. */
export async function cargarAudioGrabacion(origen: OrigenGrabaciones, uniqueid: string): Promise<string> {
  const res = await api.get(`${basePath(origen)}/audio/${encodeURIComponent(uniqueid)}`, { responseType: 'blob', timeout: 120_000 })
  return URL.createObjectURL(res.data as Blob)
}
