// middleware.ts
// This file is used to handle the middleware for the application
// It is used to handle the middleware for the application
// middleware.ts

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/auth/:path*',
    // ... other protected routes
  ]
};