import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../hooks/useThemeStore.js'

export default function ThemeToggle({ compact = false }) {
  const theme = useThemeStore(state => state.theme)
  const toggleTheme = useThemeStore(state => state.toggleTheme)

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`interactive-surface inline-flex items-center gap-2 rounded-2xl border border-app bg-elevated px-3 py-2 text-sm font-semibold text-soft shadow-soft-app ${
        compact ? '' : 'min-w-[132px] justify-center'
      }`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      {!compact && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  )
}
