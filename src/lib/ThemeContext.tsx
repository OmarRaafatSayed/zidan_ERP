'use client'
/**
 * ThemeContext — Night / Light mode toggle
 *
 * Persists to localStorage. Applies `data-theme="light"` on <html> for
 * light mode; no attribute (or "dark") for night mode.
 * All CSS tokens are overridden via [data-theme="light"] in globals.css.
 */
import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react'

type Theme = 'dark' | 'light'

interface ThemeCtx {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'dark',
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  /* Read persisted preference once on mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('erp-theme') as Theme | null
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored)
      }
    } catch {}
  }, [])

  /* Sync to <html data-theme="..."> whenever theme changes */
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light')
    } else {
      root.removeAttribute('data-theme')
    }
    try { localStorage.setItem('erp-theme', theme) } catch {}
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
