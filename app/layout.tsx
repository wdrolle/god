// app/layout.tsx
// This file is used to handle the layout of the app
// It is used to set the font and the theme of the app

import { Inter } from 'next/font/google'
import './tailwind.css';
import './globals.css'
import { Providers } from "./providers"
import { ServerAuth } from "./providers/server-auth"
import { ThemeScript } from './theme-script'

const inter = Inter({ subsets: ['latin'] })

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
