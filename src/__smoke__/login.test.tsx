import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, test } from 'vitest'
import LoginPage from '@/pages/LoginPage'

afterEach(cleanup)

test('LoginPage muestra el formulario con la marca Vital', () => {
  const qc = new QueryClient()
  const { getByText, getByLabelText, getAllByText } = render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  expect(getByText('Iniciar sesión')).toBeTruthy()
  expect(getByLabelText('Correo')).toBeTruthy()
  expect(getByLabelText('Contraseña')).toBeTruthy()
  expect(getAllByText('Vital').length).toBeGreaterThan(0)
})
