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

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Cache tokens with a TTL
const tokenCache = new Map<string, { token: any; timestamp: number }>();
const requestCache = new Map<string, { timestamp: number }>();

const CACHE_TTL = 60 * 1000; // 1 minute
const REQUEST_THROTTLE = 1000; // 1 second between same requests
const REQUEST_TIMEOUT = 5000; // 5 seconds

export async function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';
  const requestKey = request.url;
  const now = Date.now();

  // Check request throttling
  const lastRequest = requestCache.get(requestKey);
  if (lastRequest && (now - lastRequest.timestamp) < REQUEST_THROTTLE) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests' }),
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '1'
        }
      }
    );
  }
  
  // Update last request timestamp
  requestCache.set(requestKey, { timestamp: now });

  try {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      // Generate cache key from request
      const cacheKey = `${request.url}-${request.headers.get('authorization')}`;
      
      // Check token cache
      const cached = tokenCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        // Only log cache hits in development when debugging
        if (isDev && process.env.DEBUG_AUTH === 'true') {
          console.log('DEBUG: Using cached token for:', request.nextUrl.pathname);
        }
        
        if (!cached.token) {
          return new NextResponse(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return NextResponse.next();
      }

      try {
        const token = await Promise.race([
          getToken({ 
            req: request,
            secret: process.env.NEXTAUTH_SECRET
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth check timeout')), REQUEST_TIMEOUT)
          )
        ]);
        
        // Cache the result
        tokenCache.set(cacheKey, { token, timestamp: now });
        
        if (!token) {
          return new NextResponse(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return NextResponse.next();
      } catch (error) {
        console.error('Auth check error:', error);
        return new NextResponse(
          JSON.stringify({ 
            error: 'Auth check failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Fix for tokenCache iteration
  Array.from(tokenCache.entries()).forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_TTL) {
      tokenCache.delete(key);
    }
  });

  // Fix for requestCache iteration
  Array.from(requestCache.entries()).forEach(([key, value]) => {
    if (now - value.timestamp > REQUEST_THROTTLE) {
      requestCache.delete(key);
    }
  });
}, 10000);

export const config = {
  matcher: [
    '/api/chat/:path*',
    '/api/bible-chat/:path*',
    '/api/user/:path*'
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
