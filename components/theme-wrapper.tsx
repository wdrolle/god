// components/theme-wrapper.tsx
// This file is used to provide the theme wrapper for the app

/**
 * Theme Wrapper Component (components/theme-wrapper.tsx)
 * 
 * A client-side component that ensures safe theme rendering and prevents
 * hydration mismatches when using theme-dependent components.
 * 
 * Related Files:
 * - app/providers/theme-provider.tsx (Main theme provider)
 * - app/(auth)/login/page.tsx (Uses theme wrapper)
 * - app/(main)/(routes)/bible-chat/page.tsx (Uses theme wrapper)
 * - app/providers/client-providers.tsx (Theme context provider)
 * - components/theme-toggle.tsx (Theme switching)
 * - app/globals.css (Theme styles)
 * - app/theme-script.tsx (Theme initialization)
 * 
 * Used By:
 * - Pages with theme-dependent UI
 * - Components needing theme access
 * - Dynamic theme-aware sections
 * - Client-side rendered components
 * 
 * Key Features:
 * 1. Hydration safety
 * 2. Theme state access
 * 3. Client-side mounting control
 * 4. Theme transition handling
 */

'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

/**
 * Theme Wrapper Component
 * 
 * Props:
 * - children: React nodes to be rendered with theme context
 * 
 * Usage:
 * ```tsx
 * <ThemeWrapper>
 *   <ThemeAwareComponent />
 * </ThemeWrapper>
 * ```
 * 
 * Mounting Behavior:
 * 1. Initially returns null to prevent flash
 * 2. Mounts after client-side hydration
 * 3. Provides theme context to children
 */
export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  // Track component mounting state
  const [mounted, setMounted] = useState(false)
  // Access theme context
  const { theme, setTheme } = useTheme()

  // Set mounted state after initial render
  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent render until mounted
  if (!mounted) {
    return null
  }

  // Render children with theme context
  return <>{children}</>
}

/**
 * Implementation Notes:
 * 
 * 1. Client Requirement:
 *    - Must be used in client components
 *    - Requires 'use client' directive
 * 
 * 2. Usage Context:
 *    - Wrap theme-dependent components
 *    - Use in client-side pages
 *    - Place inside theme provider
 * 
 * 3. Performance:
 *    - Minimal re-renders
 *    - Small bundle impact
 *    - Efficient mounting
 */ 