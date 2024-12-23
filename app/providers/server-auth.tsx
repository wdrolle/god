import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { ClientProviders } from "./client-providers";
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

export async function ServerAuth({ children }: { children: ReactNode }) {
  // Force dynamic rendering
  headers();
  
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error('Server auth error:', error);
  }

  return (
    <ClientProviders session={session}>
      {children}
    </ClientProviders>
  );
} 