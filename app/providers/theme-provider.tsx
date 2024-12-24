// app/providers/theme-provider.tsx
// This file is used to provide the theme provider
// It is used to provide the theme provider for the app

/**
 * Theme Provider Component (app/providers/theme-provider.tsx)
 * 
 * This is a client-side component that manages theme state and switching
 * functionality across the application.
 * 
 * Related Files:
 * - app/layout.tsx (Root layout using theme provider)
 * - app/providers/client-providers.tsx (Wraps theme provider)
 * - app/theme-script.tsx (Initial theme loading)
 * - app/globals.css (Theme-related styles)
 * - components/theme-toggle.tsx (Theme switching button)
 * - components/theme-wrapper.tsx (Theme context consumer)
 * - app/(auth)/login/page.tsx (Uses theme context)
 * - app/(main)/(routes)/bible-chat/page.tsx (Uses theme context)
 * 
 * Features:
 * 1. Dark/Light theme switching
 * 2. System theme detection
 * 3. Theme persistence
 * 4. Hydration handling
 * 5. Client-side rendering safety
 * 
 * Used By Components:
 * - All pages requiring theme support
 * - UI components with theme variants
 * - Layout components
 * - Navigation elements
 */

'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps as NextThemesProviderProps } from 'next-themes/dist/types'

/**
 * Theme Provider Props
 * 
 * Extends NextThemes props but makes children handling explicit
 * for better type safety and documentation.
 */
interface ThemeProviderProps extends Omit<NextThemesProviderProps, 'children'> {
  children: React.ReactNode;
}

/**
 * Theme Provider Component
 * 
 * Handles:
 * 1. Theme state management
 * 2. Mounting state to prevent hydration issues
 * 3. Theme context provision
 * 
 * Usage:
 * ```tsx
 * <ThemeProvider
 *   attribute="class"
 *   defaultTheme="system"
 *   enableSystem
 * >
 *   {children}
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Track mounted state to prevent hydration mismatch
  const [mounted, setMounted] = React.useState(false)

  // Set mounted state after initial render
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Return children directly before mount to prevent flash
  if (!mounted) {
    return <>{children}</>
  }

  // Provide theme context once mounted
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
} 