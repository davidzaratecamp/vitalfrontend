import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Cliente, ClienteListItem, HistorialEstado } from '@/lib/types'

export interface ColaFilters {
  q?: string
  agenteId?: string
  desde?: string
  hasta?: string
}

export const useColaBackoffice = (estado?: string, filters: ColaFilters = {}) =>
  useQuery({
    queryKey: ['backoffice', 'cola', estado, filters],
    queryFn: async () =>
      (await api.get<ClienteListItem[]>('/backoffice/clientes', { params: { estado, ...filters } })).data,
    refetchInterval: 30_000,
  })

export const useHistorialBackoffice = (id: string | number | undefined) =>
  useQuery({
    queryKey: ['backoffice', 'historial', id],
    queryFn: async () => (await api.get<HistorialEstado[]>(`/backoffice/clientes/${id}/historial`)).data,
    enabled: id != null,
  })

function invalidateAll(qc: ReturnType<typeof useQueryClient>, id: string | number) {
  qc.invalidateQueries({ queryKey: ['backoffice'], exact: false })
  qc.invalidateQueries({ queryKey: ['clientes'], exact: false })
  qc.invalidateQueries({ queryKey: ['clientes', 'detalle', id] })
}

export function useCompletar(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      (await api.put<Cliente>(`/backoffice/clientes/${id}/completar`, body)).data,
    onSuccess: () => invalidateAll(qc, id),
  })
}

export function useRechazar(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (motivo: string) =>
      (await api.put<Cliente>(`/backoffice/clientes/${id}/rechazar`, { motivo })).data,
    onSuccess: () => invalidateAll(qc, id),
  })
}

/** Pasa el caso de "Pendiente BackOffice" a "Pendiente llamada tripartita"
 * — BackOffice ya lo gestionó pero necesita coordinar una llamada de 3
 * (cliente + agente + BackOffice) antes de aprobar o rechazar. */
export function usePendienteTripartita(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (motivo?: string) =>
      (await api.put<Cliente>(`/backoffice/clientes/${id}/pendiente-tripartita`, { motivo })).data,
    onSuccess: () => invalidateAll(qc, id),
  })
}

export function useObservacionBackoffice(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (comentario: string) =>
      (await api.post(`/backoffice/clientes/${id}/observacion`, { comentario })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes', 'detalle', id] }),
  })
}
