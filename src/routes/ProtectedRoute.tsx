import { Navigate, Outlet } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status)

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <HeartPulse className="size-5 animate-pulse" />
          Cargando Vital...
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  return <Outlet />
}
