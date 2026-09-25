import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { abrirArchivo } from '@/hooks/clientes'
import type { SoporteCasoPostventa } from '@/lib/types'

export const useSoportesCasoPostventa = (casoId: string | number | undefined) =>
  useQuery({
    queryKey: ['casos-postventa', casoId, 'soportes'],
    queryFn: async () => (await api.get<SoporteCasoPostventa[]>(`/soportes-caso-postventa/caso/${casoId}`)).data,
    enabled: casoId != null,
  })

export function useSubirSoporteCasoPostventa(casoId: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData()
      for (const f of files) form.append('archivos', f)
      return (await api.post<SoporteCasoPostventa[]>(`/soportes-caso-postventa/caso/${casoId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos-postventa', casoId, 'soportes'] }),
  })
}

export function useEliminarSoporteCasoPostventa(casoId: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (soporteId: number) => (await api.delete(`/soportes-caso-postventa/${soporteId}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casos-postventa', casoId, 'soportes'] }),
  })
}

export async function abrirSoporteCasoPostventa(soporteId: number, nombreArchivo = 'documento') {
  return abrirArchivo(`/soportes-caso-postventa/${soporteId}/archivo`, nombreArchivo)
}
