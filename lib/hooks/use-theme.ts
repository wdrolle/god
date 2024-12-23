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
import { ThemeProvider } from 'next-themes'

interface UseThemeReturn {
  theme: string | undefined;      // Current active theme
  setTheme: (theme: string) => void;  // Function to change theme
  systemTheme: string | undefined;     // Detected system theme
}

/**
 * Custom hook for theme management
 * 
 * @returns {UseThemeReturn} Object containing theme state and controls
 * 
 * Usage:
 * ```tsx
 * const { theme, setTheme } = useTheme();
 * // Use theme to conditionally render content
 * // Use setTheme to change theme: setTheme('dark') or setTheme('light')
 * ```
 */
export function useTheme(): UseThemeReturn {
  // Track whether component is mounted to prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  
  // Get theme controls from next-themes
  // @ts-ignore - next-themes types are not properly exported
  const { theme, setTheme, systemTheme } = ThemeProvider.useTheme()

  // Set mounted state after initial render
  useEffect(() => {
    setMounted(true)
  }, [])

  // Return placeholder values before mount to prevent hydration mismatch
  if (!mounted) {
    return {
      theme: undefined,
      setTheme: (theme: string) => {
        if (mounted) setTheme(theme)
      },
      systemTheme: undefined
    }
  }

  // Return actual theme values after mount
  return {
    theme,
    setTheme,
    systemTheme
  }
} 