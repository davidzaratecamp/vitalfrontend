import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Aseguradora, NpnProductor } from '@/lib/types'

export const useAseguradoras = (active = true) =>
  useQuery({
    queryKey: ['aseguradoras', active],
    queryFn: async () => (await api.get<Aseguradora[]>('/catalogos/aseguradoras', { params: { active } })).data,
  })

/** Aseguradoras que sí se le pueden ofrecer al cliente, según su estado
 * (Base Estados y Coberturas Vital 2026) — ya no se usa el código postal.
 * Vacío si ese estado no está en la lista — no es un error, ese estado
 * simplemente no está cubierto todavía. */
export const useAseguradorasPorEstado = (estado?: string) =>
  useQuery({
    queryKey: ['aseguradoras-por-estado', estado],
    queryFn: async () => (await api.get<Aseguradora[]>('/catalogos/aseguradoras-por-estado', { params: { estado } })).data,
    enabled: !!estado,
  })

/** Aseguradoras que un PRODUCTOR específico puede vender en ese estado
 * (BaseEstadosy CoberturasVitaldato 2026) — dos productores en el mismo
 * estado pueden tener listas distintas, cada uno licenciado con compañías
 * distintas. Vacío si ese productor no tiene cobertura definida en ese
 * estado — no es error, el Paso 5 igual cae de vuelta al catálogo por
 * estado o al completo. */
export const useAseguradorasPorProductor = (productorId?: string, estado?: string) =>
  useQuery({
    queryKey: ['aseguradoras-por-productor', productorId, estado],
    queryFn: async () =>
      (await api.get<Aseguradora[]>('/catalogos/aseguradoras-por-productor', { params: { productorId, estado } })).data,
    enabled: !!productorId && !!estado,
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
