import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ClienteRechazado, ResumenAgente } from '@/lib/types'

export const useRechazados = () =>
  useQuery({
    queryKey: ['agente', 'rechazados'],
    queryFn: async () => (await api.get<ClienteRechazado[]>('/agente/rechazados')).data,
    refetchInterval: 30_000,
  })

export const useResumenAgente = () =>
  useQuery({
    queryKey: ['agente', 'resumen'],
    queryFn: async () => (await api.get<ResumenAgente>('/agente/resumen')).data,
  })
