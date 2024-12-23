// This is a server component
import { getSession } from "@/lib/session";
import { ClientProviders } from './client-providers'

export async function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <ClientProviders session={session}>
      {children}
    </ClientProviders>
  )
} 