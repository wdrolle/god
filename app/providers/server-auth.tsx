/**
 * Server Auth Component
 * 
 * This component serves as a bridge between server-side authentication and client-side rendering.
 * It handles:
 * 1. Server-side session retrieval using NextAuth
 * 2. Dynamic rendering to ensure fresh session data
 * 3. Error handling for auth failures
 * 4. Passing session data to client components
 * 
 * The component is used in the root layout to wrap the entire application,
 * ensuring that authentication state is available throughout the app.
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { ClientProviders } from "./client-providers";
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

export async function ServerAuth({ children }: { children: ReactNode }) {
  // Force dynamic rendering to ensure fresh session data on each request
  // This prevents caching of authentication state
  headers();
  
  // Attempt to get the session server-side
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    // Log auth errors but don't throw - this allows the app to function
    // even if authentication fails
    console.error('Server auth error:', error);
  }

  // Render the client providers with the current session
  // This makes the session available to all child components
  // through the useSession hook
  return (
    <ClientProviders session={session}>
      {children}
    </ClientProviders>
  );
}

/**
 * Usage:
 * 
 * This component should be used in the root layout like this:
 * 
 * ```tsx
 * export default function RootLayout({ children }: { children: ReactNode }) {
 *   return (
 *     <html>
 *       <body>
 *         <ServerAuth>
 *           {children}
 *         </ServerAuth>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 * 
 * This ensures that:
 * 1. Authentication is handled server-side first
 * 2. Session data is passed to client components
 * 3. The app remains functional even if auth fails
 * 4. Session state is always fresh due to dynamic rendering
 */ 