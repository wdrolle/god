'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { ToastProvider } from "@/app/providers/toast-provider";
import { Session } from "next-auth";

interface ClientProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

export function ClientProviders({ children, session }: ClientProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        forcedTheme={undefined}
        themes={['light', 'dark', 'system']}
        storageKey="theme"
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
} 