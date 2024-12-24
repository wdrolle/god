// app/providers/client-providers.tsx
// This file is used to provide the client providers

/**
 * Client Providers Component (app/providers/client-providers.tsx)
 * 
 * This is a client-side wrapper component that provides various context providers
 * to the application. It handles authentication state, theme management, and toast
 * notifications.
 * 
 * Related Files:
 * - app/layout.tsx (Uses this to wrap the entire application)
 * - app/providers/server-auth.tsx (Passes session data to this component)
 * - app/providers/theme-provider.tsx (Theme context provider used here)
 * - app/providers/toast-provider.tsx (Toast notifications provider used here)
 * - lib/auth.ts (Provides session types and auth configuration)
 * 
 * Used By:
 * - Any page needing authentication state
 * - Components that need theme access
 * - UI elements that show toast notifications
 * - Client-side rendered components
 * 
 * Key Features:
 * 1. Authentication State Management (SessionProvider)
 * 2. Theme Management (ThemeProvider)
 * 3. Toast Notifications (ToastProvider)
 * 4. Client-side Context Provision
 */

'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { ToastProvider } from "@/app/providers/toast-provider";
import { Session } from "next-auth";

/**
 * Props Interface
 * 
 * children: React components to be wrapped by providers
 * session: Authentication session data from NextAuth
 */
interface ClientProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

/**
 * ClientProviders Component
 * 
 * Wraps the application with necessary providers in the following order:
 * 1. SessionProvider - Handles auth state
 * 2. ThemeProvider - Manages theme preferences
 * 3. ToastProvider - Handles toast notifications
 * 
 * Usage Example:
 * ```tsx
 * <ClientProviders session={session}>
 *   <YourApp />
 * </ClientProviders>
 * ```
 * 
 * Provider Order is Important:
 * - SessionProvider must be outermost for auth context
 * - ThemeProvider needs to wrap components using theme
 * - ToastProvider should wrap components showing toasts
 */
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

/**
 * Implementation Notes:
 * 
 * 1. Client Requirement:
 *    - Must be used in client components
 *    - Requires 'use client' directive
 * 
 * 2. Session Handling:
 *    - Receives session from server component
 *    - Makes auth state available via useSession hook
 * 
 * 3. Theme Management:
 *    - Handles theme switching
 *    - Persists theme preference
 *    - Supports system theme
 * 
 * 4. Toast Notifications:
 *    - Provides toast functionality
 *    - Handles notification state
 *    - Manages notification queue
 */ 