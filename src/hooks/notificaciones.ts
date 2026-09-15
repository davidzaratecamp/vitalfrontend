import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Notificacion } from '@/lib/types'

const POLL_MS = 20_000

export const useNotificaciones = () =>
  useQuery({
    queryKey: ['notificaciones'],
    queryFn: async () => (await api.get<Notificacion[]>('/notificaciones')).data,
    refetchInterval: POLL_MS,
  })

export const useNotificacionesNoLeidas = () =>
  useQuery({
    queryKey: ['notificaciones', 'no-leidas'],
    queryFn: async () => (await api.get<{ count: number }>('/notificaciones/no-leidas')).data.count,
    refetchInterval: POLL_MS,
  })

function invalidar(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['notificaciones'] })
}

export function useMarcarLeida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => (await api.patch(`/notificaciones/${id}/leida`)).data,
    onSuccess: () => invalidar(qc),
  })
}

export function useMarcarTodasLeidas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post('/notificaciones/marcar-todas')).data,
    onSuccess: () => invalidar(qc),
  })
}
