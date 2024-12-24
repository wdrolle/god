/**
 * lib/hooks/use-theme.ts
 * Custom hook for managing theme state in the application
 * 
 * This hook wraps next-themes functionality to provide:
 * - Type-safe theme management
 * - Hydration-safe theme switching
 * - System theme detection
 * 
 * Used by:
 * - app/(main)/(routes)/bible-chat/page.tsx (Main chat interface)
 * - Any component that needs theme awareness
 * 
 * Supported by:
 * - app/providers/theme-provider.tsx (Theme context provider)
 * - app/layout.tsx (Root layout where ThemeProvider is initialized)
 */

'use client'

import { useEffect, useState } from 'react'
import { useTheme as useNextTheme, type Theme } from 'next-themes'

interface ThemeContextType {
  theme: Theme | undefined
  setTheme: (theme: Theme) => void
  systemTheme: string | undefined
  resolvedTheme: Theme | undefined
  themes: string[]
}

export function useTheme(): ThemeContextType {
  const [mounted, setMounted] = useState(false)
  const context = useNextTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return {
      theme: undefined,
      setTheme: () => undefined,
      systemTheme: undefined,
      resolvedTheme: undefined,
      themes: []
    }
  }

  return {
    theme: context.theme as Theme,
    setTheme: context.setTheme,
    systemTheme: context.systemTheme,
    resolvedTheme: context.resolvedTheme as Theme,
    themes: context.themes || ['light', 'dark', 'system']
  }
} 