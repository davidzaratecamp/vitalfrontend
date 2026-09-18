import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { DashboardData, ReportePage } from '@/lib/types'

export interface AdminFilters {
  estado?: string
  from?: string
  to?: string
  agenteId?: number | string
  /** Admin puede elegir (Vital / Vital Asiste) — para supervisor el
   * backend lo ignora y fuerza el suyo propio, siempre. */
  empresaId?: number | string
}

export const useDashboard = (filters: AdminFilters = {}) =>
  useQuery({
    queryKey: ['admin', 'dashboard', filters],
    queryFn: async () => (await api.get<DashboardData>('/admin/dashboard', { params: filters })).data,
    refetchInterval: 60_000,
  })

export const useReporte = (filters: AdminFilters & { page?: number; pageSize?: number } = {}) =>
  useQuery({
    queryKey: ['admin', 'reporte', filters],
    queryFn: async () => (await api.get<ReportePage>('/admin/reporte', { params: filters })).data,
  })

export async function descargarReporteCsv(filters: AdminFilters = {}) {
  const res = await api.get('/admin/reporte.csv', { params: filters, responseType: 'blob' })
  const url = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte_vital_${filters.from ?? ''}_${filters.to ?? ''}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
