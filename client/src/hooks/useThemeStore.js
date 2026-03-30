import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function applyThemeToDocument(theme) {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.classList.toggle('theme-dark', theme === 'dark')
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      initializeTheme: () => {
        const theme = get().theme || 'light'
        applyThemeToDocument(theme)
      },
      setTheme: (theme) => {
        applyThemeToDocument(theme)
        set({ theme })
      },
      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark'
        applyThemeToDocument(nextTheme)
        set({ theme: nextTheme })
      },
    }),
    {
      name: 'ui-theme',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
