// lib/db.ts
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Ensure this uses the 6543 port
    },
  },
});

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
