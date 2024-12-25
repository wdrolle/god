'use client'

/**
 * Theme Provider Component
 * 
 * Purpose:
 * - Provides theme management (light/dark/system) across the entire application
 * - Handles system theme preference detection
 * - Persists theme choice in localStorage
 * - Manages theme class on document root element
 * 
 * Used By:
 * - app/providers.tsx (Main application wrapper)
 * - components/ui/styled-input.tsx (For theme-aware styling)
 * - Any component that needs theme awareness
 * 
 * How to Use:
 * 1. Wrap your app with ThemeProvider in providers.tsx:
 *    <ThemeProvider>
 *      <App />
 *    </ThemeProvider>
 * 
 * 2. Use the theme in any component:
 *    const { theme, setTheme } = useTheme();
 *    
 *    // Toggle theme
 *    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *      Toggle Theme
 *    </button>
 * 
 *    // Theme-aware styles
 *    <div className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>
 *      Content
 *    </div>
 */

import * as React from 'react'

// Available theme options
type Theme = 'light' | 'dark' | 'system'

// Props for the ThemeProvider component
interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme        // Initial theme (defaults to 'system')
  storageKey?: string        // localStorage key to persist theme choice
}

// Shape of the theme context value
interface ThemeProviderState {
  theme: Theme               // Current theme setting
  resolvedTheme: Theme      // Actual theme after resolving 'system' preference
  setTheme: (theme: Theme) => void  // Function to update theme
}

// Create context with undefined default value
const ThemeProviderContext = React.createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  ...props
}: ThemeProviderProps) {
  // Initialize theme from localStorage or default
  const [theme, setTheme] = React.useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme
    }
    return defaultTheme
  })

  // Track the resolved theme (actual light/dark value after system preference)
  const [resolvedTheme, setResolvedTheme] = React.useState<Theme>(theme)

  // Effect to update document classes and resolve system theme
  React.useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
      setResolvedTheme(systemTheme)
      return
    }

    root.classList.add(theme)
    setResolvedTheme(theme)
  }, [theme])

  // Memoized context value to prevent unnecessary rerenders
  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (theme: Theme) => {
        localStorage.setItem(storageKey, theme)
        setTheme(theme)
      },
    }),
    [theme, resolvedTheme, storageKey]
  )

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

/**
 * Custom hook to use the theme context
 * 
 * Example usage:
 * const { theme, setTheme, resolvedTheme } = useTheme();
 * 
 * - theme: Current theme setting ('light', 'dark', or 'system')
 * - setTheme: Function to update the theme
 * - resolvedTheme: Actual theme after system preference is considered
 */
export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
} 