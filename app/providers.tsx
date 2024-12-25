// app/providers.tsx

'use client'

import { ThemeProvider } from "@/lib/theme-provider"
import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        {children}
      </SessionProvider>
    </ThemeProvider>
  )
} 