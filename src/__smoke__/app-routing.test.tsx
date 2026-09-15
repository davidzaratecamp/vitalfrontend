import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, test } from 'vitest'
import App from '@/App'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/lib/types'

afterEach(cleanup)

function loginAs(role: User['role']) {
  useAuthStore.setState({
    status: 'authenticated',
    user: { id: 1, name: 'Test', email: 't@vital.local', role, avatar_color: '#6366f1' },
    // App() dispara bootstrap() al montar; sin token en localStorage lo
    // sobreescribiría a 'unauthenticated'. Lo anulamos para el smoke test.
    bootstrap: async () => {},
  })
}

function renderApp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  )
}

test('rol agente monta AgentShell con su navegación', async () => {
  loginAs('agente')
  const { findAllByText } = renderApp()
  expect((await findAllByText('Mis clientes')).length).toBeGreaterThan(0)
  expect((await findAllByText('Nuevo registro')).length).toBeGreaterThan(0)
  expect((await findAllByText('Rechazados por BackOffice')).length).toBeGreaterThan(0)
})

test('rol backoffice monta BackofficeShell con su navegación', async () => {
  loginAs('backoffice')
  const { findAllByText } = renderApp()
  expect((await findAllByText('Cola de pendientes')).length).toBeGreaterThan(0)
})

test('rol admin monta AdminShell con su navegación', async () => {
  loginAs('admin')
  const { findAllByText } = renderApp()
  expect((await findAllByText('Panel general')).length).toBeGreaterThan(0)
  expect((await findAllByText('Reporte consolidado')).length).toBeGreaterThan(0)
  expect((await findAllByText('Usuarios del sistema')).length).toBeGreaterThan(0)
})
