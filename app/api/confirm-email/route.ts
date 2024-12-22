// app/api/confirm-email/route.ts
// This is the route for confirming an email
// It is used to confirm an email for a user
// Handles confirming an email

'use server';

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/error?error=Could not confirm email`
        );
      }

      return NextResponse.redirect(`${requestUrl.origin}/auth/confirmed`);
    } catch (error) {
      console.error('Error confirming email:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/error?error=Server error`
      );
    }
  }

  // Return 400 if no code provided
  return NextResponse.json(
    { error: 'No confirmation code provided' },
    { status: 400 }
  );
}
