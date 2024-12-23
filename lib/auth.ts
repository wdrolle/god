// lib/auth.ts

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";

// Extend the built-in types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
    }
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.users.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user?.encrypted_password) {
            return null;
          }

          const isValid = await compare(
            credentials.password,
            user.encrypted_password
          );

          if (!isValid) {
            return null;
          }

          // Ensure email is never null in the returned object
          return {
            id: user.id,
            email: user.email || '', // Fallback to empty string if null
            name: user.email || null
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.email = token.email;
      }
      return session;
    }
  },
  debug: process.env.NODE_ENV === 'development',
};
