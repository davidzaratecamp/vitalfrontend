import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useDataPointCompleto, useNumeroTarjetaCompleto } from '@/hooks/clientes'
import { apiErrorMessage } from '@/lib/api'
import { EMPRESA_VITAL_ASISTE_ID } from '@/lib/clienteConstants'
import { useAuthStore } from '@/stores/auth'

// Se oculta sola a los 20s — no se queda en pantalla indefinidamente
// después de revelarla.
const OCULTAR_TRAS_MS = 20_000

/**
 * Backoffice solo ve clientes de su propia empresa (assertAccesoCliente en
 * el backend) — así que `user.empresa_id` alcanza para saber si ESTE
 * cliente es de Vital Asiste, sin tener que exponer la empresa del cliente
 * acá. Mismo criterio que assertPuedeVerNumeroTarjeta/
 * assertPuedeVerDataPoint en clientes.service.js (backend):
 * - Data Point: nunca estuvo abierto a nadie — hace falta el permiso
 *   individual siempre, en cualquier empresa (o ser admin).
 * - Número completo: en Vital Asiste hace falta el mismo permiso; en
 *   cualquier otra empresa (Vital, por ahora) sigue abierto sin él, como
 *   siempre.
 *
 * Compartido por ClienteResumen.tsx (BackOffice/admin revisando una venta)
 * y GestionCasoPage.tsx (Postventa) — antes solo existía en el primero, y
 * un caso de postventa (que es justo donde se revisan clientes YA
 * aprobados) no tenía ningún botón para pedir estos datos (2026-09-25,
 * reportado por el usuario: "estaba en el perfil de ella y los datos de
 * la tarjeta siguen sin poder verse" — Camila estaba viendo el cliente vía
 * un caso de postventa).
 */
export function usePuedeVerDataPoint() {
  const role = useAuthStore((s) => s.user?.role)
  const puedeVerDatosPago = useAuthStore((s) => s.user?.puede_ver_datos_pago)
  return role === 'admin' || !!puedeVerDatosPago
}

export function usePuedeVerNumeroTarjeta() {
  const role = useAuthStore((s) => s.user?.role)
  const empresaId = useAuthStore((s) => s.user?.empresa_id)
  const puedeVerDatosPago = useAuthStore((s) => s.user?.puede_ver_datos_pago)
  if (role === 'admin') return true
  if (empresaId === EMPRESA_VITAL_ASISTE_ID) return !!puedeVerDatosPago
  return true
}

export function NumeroTarjetaReveal({ clienteId }: { clienteId: number }) {
  const puedeVer = usePuedeVerNumeroTarjeta()
  const revelar = useNumeroTarjetaCompleto(clienteId)
  const [valor, setValor] = useState<{ numero: string; marca: string | null } | null>(null)

  useEffect(() => {
    if (!valor) return
    const t = setTimeout(() => setValor(null), OCULTAR_TRAS_MS)
    return () => clearTimeout(t)
  }, [valor])

  if (!puedeVer) return null

  async function toggle() {
    if (valor) return setValor(null)
    try {
      const data = await revelar.mutateAsync()
      if (!data?.numero_tarjeta) return toast.error('No hay una tarjeta guardada para este cliente')
      setValor({ numero: data.numero_tarjeta, marca: data.marca_tarjeta })
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo revelar el número completo'))
    }
  }

  return (
    <div className="flex items-center gap-2 pt-1">
      {valor && <span className="max-w-xs truncate font-mono text-sm">{valor.numero}{valor.marca ? ` · ${valor.marca}` : ''}</span>}
      <Button type="button" variant="outline" size="sm" onClick={toggle} disabled={revelar.isPending}>
        {valor ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {valor ? 'Ocultar' : 'Ver número completo'}
      </Button>
    </div>
  )
}

export function DataPointReveal({ clienteId }: { clienteId: number }) {
  const puedeVer = usePuedeVerDataPoint()
  const revelar = useDataPointCompleto(clienteId)
  const [valor, setValor] = useState<string | null>(null)

  useEffect(() => {
    if (!valor) return
    const t = setTimeout(() => setValor(null), OCULTAR_TRAS_MS)
    return () => clearTimeout(t)
  }, [valor])

  if (!puedeVer) return null

  async function toggle() {
    if (valor) return setValor(null)
    try {
      const data = await revelar.mutateAsync()
      if (!data.data_point) return toast.error('No hay un Data Point guardado para este cliente')
      setValor(data.data_point)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo revelar el Data Point'))
    }
  }

  return (
    <div className="flex items-center gap-2 pt-1">
      {valor && <span className="max-w-xs truncate text-sm">{valor}</span>}
      <Button type="button" variant="outline" size="sm" onClick={toggle} disabled={revelar.isPending}>
        {valor ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {valor ? 'Ocultar' : 'Ver Data Point'}
      </Button>
    </div>
  )
}
