import axios from 'axios'

export const TOKEN_KEY = 'vital_token'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export function apiErrorMessage(error: unknown, fallback = 'Ocurrió un error'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; details?: (string | { message: string })[] }
      | undefined
    if (data?.details?.length) {
      const list = data.details.map((d) => (typeof d === 'string' ? d : d.message)).join(' · ')
      return data.error ? `${data.error}: ${list}` : list
    }
    return data?.error || error.message || fallback
  }
  return fallback
}
