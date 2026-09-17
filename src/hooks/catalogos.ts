import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Aseguradora, NpnProductor } from '@/lib/types'

export const useAseguradoras = (active = true) =>
  useQuery({
    queryKey: ['aseguradoras', active],
    queryFn: async () => (await api.get<Aseguradora[]>('/catalogos/aseguradoras', { params: { active } })).data,
  })

/** Aseguradoras que sí se le pueden ofrecer al cliente, según su código
 * postal (Base Estados y Coberturas Vital 2026). Vacío si ese ZIP no está
 * en la lista — no es un error, ese estado simplemente no está cubierto
 * todavía. */
export const useAseguradorasPorZip = (codigoPostal?: string) =>
  useQuery({
    queryKey: ['aseguradoras-por-zip', codigoPostal],
    queryFn: async () => (await api.get<Aseguradora[]>('/catalogos/aseguradoras-por-zip', { params: { codigoPostal } })).data,
    enabled: !!codigoPostal && codigoPostal.length === 5,
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

/** Catálogo de productores con NPN — para la carta de firma (FirmaCloud).
 * Se muestra junto a las aseguradoras en el Paso 5. */
export const useNpnProductores = (active = true) =>
  useQuery({
    queryKey: ['npn-productores', active],
    queryFn: async () => (await api.get<NpnProductor[]>('/catalogos/npn-productores', { params: { active } })).data,
  })

export function useCrearNpnProductor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { nombre: string; npn?: string | null }) =>
      (await api.post<NpnProductor>('/catalogos/npn-productores', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['npn-productores'] }),
  })
}

export function useActualizarNpnProductor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: number; nombre?: string; npn?: string | null; is_active?: boolean }) =>
      (await api.patch<NpnProductor>(`/catalogos/npn-productores/${id}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['npn-productores'] }),
  })
}
