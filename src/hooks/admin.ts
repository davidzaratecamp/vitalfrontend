import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { DashboardData, ReportePage, PapeleraPage } from '@/lib/types'

export interface AdminFilters {
  estado?: string
  /** Nombre, apellido, correo, SSN, o ID exacto del cliente. */
  q?: string
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

export interface PapeleraFilters {
  q?: string
  agenteId?: number | string
  empresaId?: number | string
  desde?: string
  hasta?: string
  page?: number
  pageSize?: number
}

/** Solo admin (ver admin.routes.js) — supervisor no la ve. */
export const usePapelera = (filters: PapeleraFilters = {}) =>
  useQuery({
    queryKey: ['admin', 'papelera', filters],
    queryFn: async () => (await api.get<PapeleraPage>('/admin/papelera', { params: filters })).data,
  })

// Excel completo (2026-09-30, pedido del usuario: "el export me traiga toda
// la información de los formularios de ventas") — reemplaza al export CSV
// que había antes (13 columnas nada más). El backend genera un .xlsx real
// con una hoja por paso del formulario — ver streamReporteExcel en
// admin.service.js. La ruta vieja (GET /admin/reporte.csv) se deja intacta
// del lado del backend por si algo la sigue pegando directo, pero ya no se
// usa desde acá.
export async function descargarReporteExcel(filters: AdminFilters = {}) {
  const res = await api.get('/admin/reporte.xlsx', { params: filters, responseType: 'blob' })
  const url = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte_vital_${filters.from ?? ''}_${filters.to ?? ''}.xlsx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
