import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session and trying to access API routes, return 401
  if (!session && req.nextUrl.pathname.startsWith('/api/')) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Add user info to request headers
  if (session) {
    res.headers.set('X-User-Id', session.user.id);
    res.headers.set('X-User-Email', session.user.email || '');
  }

  return res;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 