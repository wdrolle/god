// app/layout.tsx
// This file is used to handle the layout of the app
// It is used to set the font and the theme of the app

/**
 * Root Layout Component (app/layout.tsx)
 * 
 * This is the root layout component that wraps all pages in the application.
 * It provides the foundational structure and global providers for the app.
 * 
 * Related Files:
 * - app/providers/server-auth.tsx (Authentication wrapper)
 * - app/providers/client-providers.tsx (Client-side providers)
 * - app/providers/theme-provider.tsx (Theme management)
 * - app/theme-script.tsx (Theme initialization script)
 * - app/globals.css (Global styles)
 * - app/tailwind.css (Tailwind configuration)
 * - lib/auth.ts (Authentication configuration)
 * - lib/session.ts (Session management)
 * 
 * Key Features:
 * 1. Global Font Configuration (Inter)
 * 2. Authentication Provider Setup
 * 3. Theme Management
 * 4. Global Styling
 * 5. Hydration Error Prevention
 * 
 * Components Used By:
 * - All pages in the application
 * - Error boundaries
 * - Loading states
 * - Modals and overlays
 */

import { Inter } from 'next/font/google'
import './tailwind.css';
import './globals.css'
import { Providers } from "./providers"
import { ServerAuth } from "./providers/server-auth"
import { ThemeScript } from './theme-script'

// Configure Inter font with Latin subset
const inter = Inter({ subsets: ['latin'] })

/**
 * Root Layout Component
 * 
 * Structure:
 * 1. HTML wrapper with language and hydration settings
 * 2. Head section for theme script
 * 3. Body with font classes
 * 4. Authentication wrapper
 * 5. Global providers
 * 
 * Provider Order (Important):
 * 1. ServerAuth (Authentication)
 * 2. Providers (Global state/context)
 * 3. Page content (children)
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ServerAuth>
          <Providers>{children}</Providers>
        </ServerAuth>
      </body>
    </html>
  )
}

/**
 * Usage Notes:
 * 
 * 1. Provider Order:
 *    The order of providers is crucial for proper functionality:
 *    - ServerAuth must wrap everything for authentication
 *    - Providers component contains client-side providers
 * 
 * 2. Hydration:
 *    suppressHydrationWarning is used to prevent warnings from:
 *    - Theme switching
 *    - Authentication state changes
 *    - Dynamic content loading
 * 
 * 3. Font Loading:
 *    Inter font is loaded and applied globally through className
 * 
 * 4. Theme Handling:
 *    ThemeScript prevents flash of wrong theme on load
 */
