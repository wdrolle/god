// lib/auth.ts

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { user_role_enum } from "@prisma/client";

// Define NextAuth options
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
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

        const user = await prisma.users.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            god_users: true
          }
        });

        if (!user) {
          return null;
        }

        const isValid = await compare(
          credentials.password, 
          user.encrypted_password || ''
        );

        if (!isValid) {
          return null;
        }

        const godUser = user.god_users[0];

        return {
          id: user.id,
          email: user.email,
          name: godUser?.first_name || user.email,
          role: (godUser?.role || 'USER') as user_role_enum
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role as user_role_enum;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always allow the dashboard URL
      if (url.startsWith('/dashboard')) {
        return url;
      }
      // Default to dashboard for successful sign in
      if (url === '/login') {
        return '/dashboard';
      }
      return baseUrl;
    }
  },
  debug: process.env.NODE_ENV === 'development',
};

// Extend next-auth types
declare module "next-auth" {
  interface User {
    id: string;
    role: user_role_enum;
  }
  
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: user_role_enum;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: user_role_enum;
  }
}
