import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isDefaultPassword: false,
      
      login: (token, user) => {
        localStorage.setItem('token', token)
        set({ 
          token, 
          user, 
          isAuthenticated: true,
          isDefaultPassword: user?.isDefaultPassword || false
        })
      },
      
      logout: () => {
        localStorage.removeItem('token')
        set({ token: null, user: null, isAuthenticated: false, isDefaultPassword: false })
      },
      
      checkAuth: () => {
        const token = localStorage.getItem('token')
        if (token) {
          set({ token, isAuthenticated: true })
        }
      },

      markPasswordChanged: () => {
        set({ isDefaultPassword: false })
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)