// components/providers/ThemeProvider.tsx

"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { NextUIProvider } from "@nextui-org/react"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <NextUIProvider>
        {children}
      </NextUIProvider>
    </NextThemesProvider>
  )
} 