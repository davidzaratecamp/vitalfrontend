import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { User } from '@/lib/types'

export const useUsuarios = (role?: string) =>
  useQuery({
    queryKey: ['usuarios-sistema', role],
    queryFn: async () => (await api.get<User[]>('/usuarios-sistema', { params: { role } })).data,
  })

export function useCrearUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; email: string; password: string; role: string }) =>
      (await api.post<User>('/usuarios-sistema', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios-sistema'] }),
  })
}

export function useActualizarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number } & Partial<{ name: string; email: string; password: string; role: string; is_active: boolean }>) =>
      (await api.patch<User>(`/usuarios-sistema/${id}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios-sistema'] }),
  })
}

export function useDesactivarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/usuarios-sistema/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios-sistema'] }),
  })
}
