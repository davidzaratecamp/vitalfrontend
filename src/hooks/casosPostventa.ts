import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  CasoPostventaDetalle,
  CasoPostventaListItem,
  ClientePostventaContacto,
  HistorialCasoPostventa,
} from '@/lib/types'

/** Compuerta antes de abrir/crear un caso — busca entre clientes ya
 * APROBADOS por los 3 teléfonos del titular. Es mutation (no query) porque
 * se dispara a pedido, con el botón "Validar", igual que
 * useVerificarTelefono en hooks/clientes.ts. */
export function useValidarTelefonoPostventa() {
  return useMutation({
    mutationFn: async (telefono: string) =>
      (await api.get<ClientePostventaContacto[]>('/casos-postventa/validar-telefono', { params: { telefono } })).data,
  })
}

export function useCrearCasoPostventa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      cliente_id: number
      tipo_caso: string
      telefono_contacto: string
      observacion_inicial?: string
    }) => (await api.post<CasoPostventaDetalle>('/casos-postventa', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos-postventa'] }),
  })
}

export interface CasosPostventaFilters {
  estados?: string[]
  q?: string
  tipo_caso?: string
  tipo_gestion?: string
  desde?: string
  hasta?: string
}

export const useCasosPostventa = (filters: CasosPostventaFilters = {}) =>
  useQuery({
    queryKey: ['casos-postventa', 'lista', filters],
    queryFn: async () =>
      (
        await api.get<CasoPostventaListItem[]>('/casos-postventa', {
          params: {
            estados: filters.estados?.length ? filters.estados.join(',') : undefined,
            q: filters.q,
            tipo_caso: filters.tipo_caso,
            tipo_gestion: filters.tipo_gestion,
            desde: filters.desde,
            hasta: filters.hasta,
          },
        })
      ).data,
    refetchInterval: 30_000,
  })

export const useCasoPostventa = (id: string | number | undefined) =>
  useQuery({
    queryKey: ['casos-postventa', 'detalle', id],
    queryFn: async () => (await api.get<CasoPostventaDetalle>(`/casos-postventa/${id}`)).data,
    enabled: id != null,
  })

export const useHistorialCasoPostventa = (id: string | number | undefined) =>
  useQuery({
    queryKey: ['casos-postventa', 'historial', id],
    queryFn: async () => (await api.get<HistorialCasoPostventa[]>(`/casos-postventa/${id}/historial`)).data,
    enabled: id != null,
  })

export function useActualizarCasoPostventa(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { estado?: string; tipo_gestion?: string | null; motivo?: string }) =>
      (await api.patch<CasoPostventaDetalle>(`/casos-postventa/${id}`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['casos-postventa'] })
      // El caso se "abre" desbloqueando la edición del cliente (ver
      // assertCanEdit en clientes.routes.js) — al cerrarlo/escalarlo hay
      // que refrescar también el detalle del cliente, para que la
      // pantalla se vuelva de solo lectura al instante.
      qc.invalidateQueries({ queryKey: ['clientes'], exact: false })
    },
  })
}
