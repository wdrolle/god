import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import type { Session } from "next-auth";

export async function getSession(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
} 