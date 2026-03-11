import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      login: (token, user) => {
        localStorage.setItem('token', token)
        set({ token, user, isAuthenticated: true })
      },
      
      logout: () => {
        localStorage.removeItem('token')
        set({ token: null, user: null, isAuthenticated: false })
      },
      
      checkAuth: () => {
        const token = localStorage.getItem('token')
        if (token) {
          set({ token, isAuthenticated: true })
        }
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)