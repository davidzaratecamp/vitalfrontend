import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { AgentShell } from '@/components/layout/AgentShell'
import { BackofficeShell } from '@/components/layout/BackofficeShell'
import { AdminShell } from '@/components/layout/AdminShell'
import { SupervisorShell } from '@/components/layout/SupervisorShell'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import SettingsPage from '@/pages/SettingsPage'

// Agente — Ventas
const MisClientesPage = lazy(() => import('@/pages/agente/MisClientesPage'))
const NuevoRegistroPage = lazy(() => import('@/pages/agente/NuevoRegistroPage'))
const RechazadosPage = lazy(() => import('@/pages/agente/RechazadosPage'))

// Postventa — pestaña propia dentro de Agente (2026-09-24: "el customer es
// el mismo agente", el rol Customer se integró acá) y de BackOffice/admin
// para sus propias colas. GestionCasoPage es la única compartida por los 3.
const ValidarClientePage = lazy(() => import('@/pages/casosPostventa/ValidarClientePage'))
const CasosPorGestionarPage = lazy(() => import('@/pages/casosPostventa/CasosPorGestionarPage'))
const CasosGestionadosPage = lazy(() => import('@/pages/casosPostventa/CasosGestionadosPage'))
const GestionCasoPage = lazy(() => import('@/pages/casosPostventa/GestionCasoPage'))

// BackOffice
const ColaPage = lazy(() => import('@/pages/backoffice/ColaPage'))
const CompletadosPage = lazy(() => import('@/pages/backoffice/CompletadosPage'))
const RechazadosBackofficePage = lazy(() => import('@/pages/backoffice/RechazadosPage'))
const GestionClientePage = lazy(() => import('@/pages/backoffice/GestionClientePage'))
const PostventaPage = lazy(() => import('@/pages/backoffice/PostventaPage'))

// Admin
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'))
const ReportePage = lazy(() => import('@/pages/admin/ReportePage'))
const ClienteDetallePage = lazy(() => import('@/pages/admin/ClienteDetallePage'))
// UsuariosPage: import lazy quitado junto con su ruta (ver comentario más
// abajo) — el archivo sigue existiendo.
const CatalogosPage = lazy(() => import('@/pages/admin/CatalogosPage'))
const AdminPostventaPage = lazy(() => import('@/pages/admin/PostventaPage'))

function PageFallback() {
  return (
    <div className="flex h-64 items-center justify-center text-muted-foreground">
      <HeartPulse className="size-5 animate-pulse" />
    </div>
  )
}

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap)
  const role = useAuthStore((s) => s.user?.role)

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          {role === 'agente' ? (
            <Route element={<AgentShell />}>
              <Route path="/" element={<MisClientesPage />} />
              <Route path="/nuevo" element={<NuevoRegistroPage />} />
              <Route path="/clientes/:id/editar" element={<NuevoRegistroPage />} />
              <Route path="/rechazados" element={<RechazadosPage />} />
              {/* Postventa (2026-09-24) — antes era un rol aparte
                  (Customer); ahora vive acá, agrupada bajo /postventa/* para
                  no chocar con las rutas de venta de arriba. */}
              <Route path="/postventa" element={<ValidarClientePage />} />
              <Route path="/postventa/por-gestionar" element={<CasosPorGestionarPage />} />
              <Route path="/postventa/gestionados" element={<CasosGestionadosPage />} />
              <Route path="/postventa/casos/:id" element={<GestionCasoPage />} />
              <Route path="/ajustes" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          ) : role === 'backoffice' ? (
            <Route element={<BackofficeShell />}>
              <Route path="/" element={<ColaPage />} />
              <Route path="/completados" element={<CompletadosPage />} />
              <Route path="/rechazados" element={<RechazadosBackofficePage />} />
              <Route path="/clientes/:id" element={<GestionClientePage />} />
              <Route path="/postventa" element={<PostventaPage />} />
              <Route path="/casos/:id" element={<GestionCasoPage />} />
              <Route path="/ajustes" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          ) : role === 'admin' ? (
            <Route element={<AdminShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/reporte" element={<ReportePage />} />
              <Route path="/clientes/:id" element={<ClienteDetallePage />} />
              {/* /usuarios (UsuariosPage) quitada del admin (2026-09-22) —
                  "el admin no puede gestionar usuarios". El archivo sigue
                  en pages/admin/UsuariosPage.tsx y el backend también la
                  bloquea (usuariosSistema.routes.js); para reactivar,
                  restaurar esta ruta + el import lazy de abajo + el link en
                  AdminShell.tsx. */}
              <Route path="/postventa" element={<AdminPostventaPage />} />
              <Route path="/casos/:id" element={<GestionCasoPage />} />
              <Route path="/catalogos" element={<CatalogosPage />} />
              <Route path="/ajustes" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          ) : role === 'supervisor' ? (
            <Route element={<SupervisorShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/reporte" element={<ReportePage />} />
              <Route path="/clientes/:id" element={<ClienteDetallePage />} />
              <Route path="/ajustes" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          ) : (
            <Route path="*" element={<PageFallback />} />
          )}
        </Route>
      </Routes>
    </Suspense>
  )
}
