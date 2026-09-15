import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Aseguradora } from '@/lib/types'

export const useAseguradoras = (active = true) =>
  useQuery({
    queryKey: ['aseguradoras', active],
    queryFn: async () => (await api.get<Aseguradora[]>('/catalogos/aseguradoras', { params: { active } })).data,
  })

export function useCrearAseguradora() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (nombre: string) => (await api.post<Aseguradora>('/catalogos/aseguradoras', { nombre })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aseguradoras'] }),
  })
}

export function useActualizarAseguradora() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number; nombre?: string; is_active?: boolean }) =>
      (await api.patch<Aseguradora>(`/catalogos/aseguradoras/${id}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aseguradoras'] }),
  })
}
