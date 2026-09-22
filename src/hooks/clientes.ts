import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  Cliente,
  ClienteContacto,
  ClienteDetalle,
  ClienteDuplicado,
  ClienteListItem,
  Dependiente,
  Evidencia,
  Ingreso,
  InformacionPago,
  NumeroTarjetaCompleto,
  DataPointCompleto,
  PlanSalud,
  SoportePoliza,
} from '@/lib/types'

export interface ClienteFilters {
  estado?: string
  q?: string
}

export const useClientes = (filters: ClienteFilters = {}) =>
  useQuery({
    queryKey: ['clientes', filters],
    queryFn: async () => (await api.get<ClienteListItem[]>('/clientes', { params: filters })).data,
  })

export const useCliente = (id: string | number | undefined) =>
  useQuery({
    queryKey: ['clientes', 'detalle', id],
    queryFn: async () => (await api.get<ClienteDetalle>(`/clientes/${id}`)).data,
    enabled: id != null,
  })

/** Aviso de posible cliente duplicado (mismo SSN o correo) mientras el agente
 * llena el Paso 1 de un registro nuevo — no bloquea, solo informa. */
export const useVerificarDuplicado = (social: string, correo: string, enabled: boolean) =>
  useQuery({
    queryKey: ['clientes', 'verificar-duplicado', social, correo],
    queryFn: async () =>
      (await api.get<ClienteDuplicado[]>('/clientes/verificar-duplicado', { params: { social, correo } })).data,
    enabled: enabled && (social.length === 9 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)),
    staleTime: 10_000,
  })

/** Compuerta antes de "Nuevo registro": valida el teléfono a pedido (botón
 * "Validar"), no en automático — por eso es mutation y no query. */
export function useVerificarTelefono() {
  return useMutation({
    mutationFn: async ({ telefono }: { telefono: string }) =>
      (await api.get<ClienteContacto[]>('/clientes/verificar-telefono', { params: { telefono } })).data,
  })
}

function invalidateCliente(qc: ReturnType<typeof useQueryClient>, id: string | number) {
  qc.invalidateQueries({ queryKey: ['clientes', 'detalle', id] })
  qc.invalidateQueries({ queryKey: ['clientes'], exact: false })
}

export function useCrearCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => (await api.post<Cliente>('/clientes', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  })
}

export function useActualizarTitular(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => (await api.patch<Cliente>(`/clientes/${id}`, body)).data,
    onSuccess: () => invalidateCliente(qc, id),
  })
}

/* ───────────────────────── Paso 2 — Cónyuge ───────────────────────── */

export const useConyuge = (id: string | number | undefined) =>
  useQuery({
    queryKey: ['clientes', id, 'conyuge'],
    queryFn: async () => (await api.get<Dependiente | null>(`/clientes/${id}/conyuge`)).data,
    enabled: id != null,
  })

export function useSetConyuge(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      (await api.put<Dependiente | null>(`/clientes/${id}/conyuge`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes', id, 'conyuge'] })
      invalidateCliente(qc, id)
    },
  })
}

/* ───────────────────────── Paso 3 — Dependientes ───────────────────────── */

export const useDependientes = (id: string | number | undefined) =>
  useQuery({
    queryKey: ['clientes', id, 'dependientes'],
    queryFn: async () => (await api.get<Dependiente[]>(`/clientes/${id}/dependientes`)).data,
    enabled: id != null,
  })

export function useAgregarDependiente(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      (await api.post<Dependiente>(`/clientes/${id}/dependientes`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes', id, 'dependientes'] })
      invalidateCliente(qc, id)
    },
  })
}

export function useActualizarDependiente(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ depId, body }: { depId: number; body: Record<string, unknown> }) =>
      (await api.patch<Dependiente>(`/clientes/${id}/dependientes/${depId}`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes', id, 'dependientes'] })
      invalidateCliente(qc, id)
    },
  })
}

export function useEliminarDependiente(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (depId: number) => (await api.delete(`/clientes/${id}/dependientes/${depId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes', id, 'dependientes'] })
      qc.invalidateQueries({ queryKey: ['clientes', id, 'ingresos'] })
      invalidateCliente(qc, id)
    },
  })
}

/* ───────────────────────── Paso 4 — Ingresos ───────────────────────── */

export const useIngresos = (id: string | number | undefined) =>
  useQuery({
    queryKey: ['clientes', id, 'ingresos'],
    queryFn: async () =>
      (await api.get<{ rows: Ingreso[]; total_familia: number }>(`/clientes/${id}/ingresos`)).data,
    enabled: id != null,
  })

export function useSetIngresoTitular(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      (await api.put<Ingreso | null>(`/clientes/${id}/ingresos`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes', id, 'ingresos'] })
      invalidateCliente(qc, id)
    },
  })
}

export function useSetIngresoDependiente(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ depId, body }: { depId: number; body: Record<string, unknown> }) =>
      (await api.put<Ingreso | null>(`/clientes/${id}/dependientes/${depId}/ingresos`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes', id, 'ingresos'] })
      invalidateCliente(qc, id)
    },
  })
}

/* ───────────────────────── Paso 5 — Plan de salud ───────────────────────── */

export const usePlanSalud = (id: string | number | undefined) =>
  useQuery({
    queryKey: ['clientes', id, 'plan-salud'],
    queryFn: async () => (await api.get<PlanSalud | null>(`/clientes/${id}/plan-salud`)).data,
    enabled: id != null,
  })

export function useSetPlanSalud(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      (await api.put<PlanSalud>(`/clientes/${id}/plan-salud`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes', id, 'plan-salud'] })
      invalidateCliente(qc, id)
    },
  })
}

/* ───────────────────────── Paso 6 — Pago ───────────────────────── */

export const usePago = (id: string | number | undefined) =>
  useQuery({
    queryKey: ['clientes', id, 'pago'],
    queryFn: async () => (await api.get<InformacionPago | null>(`/clientes/${id}/pago`)).data,
    enabled: id != null,
  })

/** Bajo demanda (no automático): cada llamada queda auditada en el
 * servidor, así que solo se pide cuando BackOffice/Admin hace clic en "Ver
 * número completo" — no al cargar la pantalla. */
export function useNumeroTarjetaCompleto(id: string | number) {
  return useMutation({
    mutationFn: async () => (await api.get<NumeroTarjetaCompleto | null>(`/clientes/${id}/pago/numero-completo`)).data,
  })
}

/** Bajo demanda, igual que el número de tarjeta — solo BackOffice/Admin. */
export function useDataPointCompleto(id: string | number) {
  return useMutation({
    mutationFn: async () => (await api.get<DataPointCompleto>(`/clientes/${id}/pago/data-point`)).data,
  })
}

export function useSetPago(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      (await api.put<InformacionPago>(`/clientes/${id}/pago`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes', id, 'pago'] })
      invalidateCliente(qc, id)
    },
  })
}

/* ───────────────────────── Paso 7 — Evidencias ───────────────────────── */

export const useEvidencias = (id: string | number | undefined) =>
  useQuery({
    queryKey: ['clientes', id, 'evidencias'],
    queryFn: async () => (await api.get<Evidencia[]>(`/evidencias/cliente/${id}`)).data,
    enabled: id != null,
  })

export function useSubirEvidencias(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ files, categoria, descripcion }: { files: File[]; categoria: string; descripcion?: string }) => {
      const form = new FormData()
      for (const f of files) form.append('archivos', f)
      form.append('categoria', categoria)
      if (descripcion) form.append('descripcion', descripcion)
      return (await api.post<Evidencia[]>(`/evidencias/cliente/${id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes', id, 'evidencias'] })
      invalidateCliente(qc, id)
    },
  })
}

export function useEliminarEvidencia(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (evidenciaId: number) => (await api.delete(`/evidencias/${evidenciaId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes', id, 'evidencias'] })
      invalidateCliente(qc, id)
    },
  })
}

export function evidenciaUrl(evidenciaId: number) {
  // Relativa a `api` (que ya tiene baseURL '/api') — sin el prefijo /api acá,
  // o el request termina pidiendo /api/api/... y siempre da 404.
  return `/evidencias/${evidenciaId}/archivo`
}

/**
 * Abre una evidencia (PDF/imagen) en una pestaña nueva, visible en pantalla y
 * con un botón para descargarla. El archivo está detrás de una ruta
 * autenticada, así que no sirve un <a href> directo — hay que pedirlo con el
 * token y convertirlo en blob.
 *
 * Abrimos la pestaña ANTES del fetch (con about:blank) para que siga
 * contando como respuesta directa al clic del usuario — si se abre después
 * del await, el navegador la trata como popup no solicitado y la bloquea en
 * silencio, dejando esa primera pestaña en blanco para siempre. Importante:
 * NO se puede pasar 'noopener' acá, porque eso hace que `window.open` mismo
 * devuelva null (perdemos la referencia con la que íbamos a rellenarla).
 */
export async function abrirEvidencia(evidenciaId: number, nombreArchivo = 'evidencia') {
  return abrirArchivo(evidenciaUrl(evidenciaId), nombreArchivo)
}

/** Misma lógica de visor que `abrirEvidencia`, generalizada para cualquier
 * ruta autenticada que sirva un archivo (evidencias, soporte de póliza). */
export async function abrirArchivo(rutaArchivo: string, nombreArchivo = 'archivo') {
  const ventana = window.open('', '_blank')
  try {
    const res = await api.get(rutaArchivo, { responseType: 'blob' })
    const blob = res.data as Blob
    const url = URL.createObjectURL(blob)
    const esImagen = blob.type.startsWith('image/')

    if (!ventana) {
      // El navegador bloqueó incluso la pestaña en blanco (poco común) —
      // como último recurso, al menos disparamos la descarga directa.
      const a = document.createElement('a')
      a.href = url
      a.download = nombreArchivo
      document.body.append(a)
      a.click()
      a.remove()
      return
    }

    ventana.document.title = nombreArchivo
    ventana.document.body.style.cssText = 'margin:0;height:100vh;display:flex;flex-direction:column;background:#525659;font-family:system-ui,sans-serif'
    ventana.document.body.innerHTML = `
      <div style="flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;background:#323639;color:#fff">
        <span style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${nombreArchivo}</span>
        <a href="${url}" download="${nombreArchivo}" style="flex:0 0 auto;color:#fff;background:#4b5563;padding:6px 14px;border-radius:6px;font-size:13px;text-decoration:none">Descargar</a>
      </div>
      <div style="flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;overflow:auto">
        ${
          esImagen
            ? `<img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain" />`
            : `<embed src="${url}" type="${blob.type || 'application/pdf'}" style="width:100%;height:100%" />`
        }
      </div>
    `
  } catch (err) {
    ventana?.close()
    throw err
  }
}

/* ───────────────────────── Soporte de póliza (BackOffice) ─────────────────────────
 * Adjunto opcional (PDF o imagen) que BackOffice puede sumar a un caso —
 * tabla y ruta separadas de las evidencias del Paso 7 del agente porque el
 * dueño y el permiso son distintos (ver soportesPoliza.routes.js). */

export const useSoportesPoliza = (id: string | number | undefined) =>
  useQuery({
    queryKey: ['clientes', id, 'soportes-poliza'],
    queryFn: async () => (await api.get<SoportePoliza[]>(`/soportes-poliza/cliente/${id}`)).data,
    enabled: id != null,
  })

export function useSubirSoportePoliza(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData()
      for (const f of files) form.append('archivos', f)
      return (await api.post<SoportePoliza[]>(`/soportes-poliza/cliente/${id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes', id, 'soportes-poliza'] }),
  })
}

export function useEliminarSoportePoliza(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (soporteId: number) => (await api.delete(`/soportes-poliza/${soporteId}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes', id, 'soportes-poliza'] }),
  })
}

export function soportePolizaUrl(soporteId: number) {
  return `/soportes-poliza/${soporteId}/archivo`
}

export async function abrirSoportePoliza(soporteId: number, nombreArchivo = 'soporte de póliza') {
  return abrirArchivo(soportePolizaUrl(soporteId), nombreArchivo)
}

/* ───────────────────────── Finalizar / observaciones ───────────────────────── */

export function useFinalizar(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post<Cliente>(`/clientes/${id}/finalizar`)).data,
    onSuccess: () => invalidateCliente(qc, id),
  })
}

export function useAgregarObservacionCliente(id: string | number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (comentario: string) =>
      (await api.post(`/clientes/${id}/observaciones`, { comentario })).data,
    onSuccess: () => invalidateCliente(qc, id),
  })
}
