// app/layout.tsx
// This file is used to handle the layout of the app
// It is used to set the font and the theme of the app

import { Inter } from 'next/font/google'
import './tailwind.css';
import './globals.css'
import { Providers } from "./providers"
import { ThemeProvider } from '@/app/providers/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
