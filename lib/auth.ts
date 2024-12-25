/**
 * Authentication Configuration (lib/auth.ts)
 * 
 * This file configures NextAuth.js authentication for the application.
 * It defines the authentication logic, session handling, and user types.
 * 
 * Related Files:
 * - app/providers/server-auth.tsx (Uses authOptions for server-side session)
 * - app/api/auth/[...nextauth]/route.ts (Uses authOptions for auth routes)
 * - app/(auth)/login/page.tsx (Uses the configured credentials provider)
 * - app/providers/client-providers.tsx (Uses session types defined here)
 * - middleware.ts (Uses auth configuration for route protection)
 * - lib/session.ts (Uses authOptions for session retrieval)
 * 
 * Key Features:
 * 1. Configures Credentials authentication provider
 * 2. Sets up Prisma adapter for database integration
 * 3. Defines session strategy and callbacks
 * 4. Extends NextAuth types for TypeScript support
 * 5. Handles password comparison and user validation
 */

import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
    }
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
  }
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.users.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user?.encrypted_password) {
          return null;
        }

        const isValid = await compare(credentials.password, user.encrypted_password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.email
        };
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user = {
          id: token.sub as string,
          email: token.email as string,
          name: token.name as string,
        };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name || user.email;
      }
      return token;
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Sign in event:', { user, isNewUser });
      }
    }
  }
};
