import { create } from 'zustand'

export interface SunshineUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

interface AuthState {
  user: SunshineUser | null
  token: string | null
  isLoading: boolean
  setAuth: (token: string, user: SunshineUser) => void
  logout: () => void
  loadFromStorage: () => void
  hasRole: (...roles: string[]) => boolean
  isAdmin: () => boolean
  isFinance: () => boolean
  isApprover: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (token, user) => {
    localStorage.setItem('sunshine_token', token)
    localStorage.setItem('sunshine_user', JSON.stringify(user))
    set({ token, user, isLoading: false })
  },

  logout: () => {
    localStorage.removeItem('sunshine_token')
    localStorage.removeItem('sunshine_user')
    set({ user: null, token: null, isLoading: false })
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('sunshine_token')
    const userStr = localStorage.getItem('sunshine_user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ token, user, isLoading: false })
      } catch {
        set({ isLoading: false })
      }
    } else {
      set({ isLoading: false })
    }
  },

  hasRole: (...roles: string[]) => {
    const { user } = get()
    return user ? roles.includes(user.role) : false
  },

  isAdmin: () => get().user?.role === 'ADMIN',
  isFinance: () => ['FINANCE', 'ADMIN'].includes(get().user?.role ?? ''),
  isApprover: () => ['APPROVER', 'SENIOR_APPROVER', 'ADMIN'].includes(get().user?.role ?? ''),
}))
