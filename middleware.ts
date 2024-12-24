// middleware.ts
// This file is used to handle the middleware for the application
// It is used to handle the middleware for the application
// middleware.ts

/**
 * Authentication Middleware (middleware.ts)
 * 
 * This middleware protects routes by verifying authentication state.
 * It integrates with NextAuth.js to handle route protection and redirects.
 * 
 * Related Files:
 * - lib/auth.ts (Provides auth configuration)
 * - app/api/auth/[...nextauth]/route.ts (Handles auth endpoints)
 * - app/providers/server-auth.tsx (Server-side auth handling)
 * 
 * Key Features:
 * 1. Route protection
 * 2. Authentication verification
 * 3. Token validation
 * 4. Secure API endpoints
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * NextAuth Middleware Configuration
 * 
 * withAuth wraps our middleware to provide authentication checks.
 * It automatically:
 * 1. Verifies JWT tokens
 * 2. Handles unauthorized access
 * 3. Manages redirects to login
 * 4. Protects specified routes
 */
export default withAuth(
  function middleware(req) {
    // Allow request to continue if authenticated
    return NextResponse.next();
  },
  {
    callbacks: {
      // Only allow access if valid token exists
      authorized: ({ token }) => !!token,
    },
  }
);

/**
 * Route Configuration
 * 
 * Specifies which routes require authentication.
 * Format: path/:path* protects all nested routes
 * 
 * Protected Routes:
 * - /dashboard/*     : All dashboard pages and features
 * - /api/auth/*      : Authentication API endpoints
 * - /bible-chat/*    : Bible chat feature and API
 * - /settings/*      : User settings pages
 * - /profile/*       : User profile pages
 * - /messages/*      : Messaging features
 * - /api/protected/* : Protected API endpoints
 */
export const config = {
  matcher: [
    // App routes
    '/dashboard/:path*',
    '/bible-chat/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/messages/:path*',
    
    // API routes
    '/api/auth/:path*',
    '/api/chat/:path*',
    '/api/bible-chat/:path*',
    '/api/settings/:path*',
    '/api/profile/:path*',
    '/api/messages/:path*',
    '/api/protected/:path*',
    '/api/generate-message/:path*',
    '/bible-chat/:path*'
  ]
};

/**
 * Usage Notes:
 * 
 * 1. Public Routes:
 *    - /           : Home page
 *    - /login     : Login page
 *    - /register  : Registration page
 *    - /about     : About page
 *    - /contact   : Contact page
 * 
 * 2. Protected Routes:
 *    All routes specified in the matcher array require authentication.
 *    Unauthorized access will redirect to /login with return URL.
 * 
 * 3. API Protection:
 *    - All /api/protected/* routes require valid JWT
 *    - Auth endpoints handle their own protection
 *    - Public API endpoints should be outside protected paths
 */
