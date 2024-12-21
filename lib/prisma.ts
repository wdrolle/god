// lib/prisma.ts
// This file is used to handle the prisma client
// It is used to connect to the prisma database

import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global `var` declarations to prevent multiple instances in development
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL, // Ensure DIRECT_URL is set in your .env
      },
    },
    log: ['query', 'info', 'warn', 'error'], // Optional: Enable logging for debugging
  });

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export { prisma };