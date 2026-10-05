import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Grabacion {
  registro_llamada_id: number
  proyecto_id: number
  fecha: string
  hora: string
  telefono: string
  duracion: number
  campana: string | null
  agente: string | null
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
export async function cargarAudioGrabacion(origen: OrigenGrabaciones, registroId: number): Promise<string> {
  const res = await api.get(`${basePath(origen)}/audio/${registroId}`, { responseType: 'blob', timeout: 120_000 })
  return URL.createObjectURL(res.data as Blob)
}
