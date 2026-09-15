import { create } from 'zustand'
import { api, TOKEN_KEY } from '@/lib/api'
import type { User } from '@/lib/types'

interface AuthState {
  user: User | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  bootstrap: () => Promise<void>
  setUser: (u: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    set({ user: data.user, status: 'authenticated' })
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ user: null, status: 'unauthenticated' })
  },
  bootstrap: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      set({ status: 'unauthenticated' })
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data.user, status: 'authenticated' })
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      set({ user: null, status: 'unauthenticated' })
    }
  },
  setUser: (user) => set({ user }),
}))
