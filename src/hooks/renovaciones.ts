import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Cliente, CambioCliente, RenovacionListItem, ResumenTemporada } from '@/lib/types'

/**
 * Apartado Renovaciones. Ojo: acá solo viven el listado, la temporada y el
 * envío a BackOffice — los formularios, las evidencias y la gestión de
 * BackOffice siguen siendo los MISMOS hooks de siempre (hooks/clientes.ts,
 * hooks/backoffice.ts), porque una renovación es la misma venta con el
 * mismo ID en otro estado.
 */
export interface RenovacionFilters {
  estados?: string[]
  q?: string
  anio?: number
  desde?: string
  hasta?: string
}

export const useRenovaciones = (filters: RenovacionFilters = {}) =>
  useQuery({
    queryKey: ['renovaciones', filters],
    queryFn: async () =>
      (
        await api.get<RenovacionListItem[]>('/renovaciones', {
          params: {
            estados: filters.estados?.length ? filters.estados.join(',') : undefined,
            q: filters.q || undefined,
            anio: filters.anio || undefined,
            desde: filters.desde || undefined,
            hasta: filters.hasta || undefined,
          },
        })
      ).data,
  })

export const useTemporadaRenovacion = () =>
  useQuery({
    queryKey: ['renovaciones', 'temporada'],
    queryFn: async () => (await api.get<ResumenTemporada>('/renovaciones/temporada')).data,
  })

/** Solo admin. Es idempotente — apretarlo dos veces no mueve nada dos veces. */
export function useAbrirTemporada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body?: { anio?: number }) =>
      (await api.post<{ temporada: number; movidas: number; ids: number[] }>('/renovaciones/abrir-temporada', body ?? {}))
        .data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['renovaciones'] }),
  })
}

/** El equivalente de "Finalizar" de una venta, pero para la renovación. */
export function useFinalizarRenovacion(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post<Cliente>(`/renovaciones/${id}/finalizar`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['renovaciones'] })
      qc.invalidateQueries({ queryKey: ['cliente', String(id)] })
    },
  })
}

/**
 * Historial de CAMBIOS de datos (qué campo se tocó, de qué valor a cuál).
 * Sin `contexto` trae todo el historial del registro; con
 * `contexto: 'renovacion'`, solo lo que se cambió renovando.
 */
export const useCambiosCliente = (id: string | number | undefined, contexto?: string) =>
  useQuery({
    queryKey: ['renovaciones', 'cambios', String(id), contexto ?? 'todos'],
    enabled: !!id,
    queryFn: async () =>
      (await api.get<CambioCliente[]>(`/renovaciones/${id}/cambios`, { params: { contexto: contexto || undefined } })).data,
  })
