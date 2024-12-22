// middleware.ts
// This file is used to handle the middleware for the application
// It is used to handle the middleware for the application
// middleware.ts

import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Allow the request to proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/codes/:path*',
    '/stakeholders/:path*',
    '/server/:path*',
    '/protected-route/:path*',
  ]
}