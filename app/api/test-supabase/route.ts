import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Add these exports to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'edge';  // or 'nodejs' if you prefer

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    console.log('[DEBUG] Testing Supabase connection from API route');
    const { data: dbTest, error: dbError } = await supabase
      .from('god_users')
      .select('count')
      .single();

    console.log('[DEBUG] Database test results:', { dbTest, dbError });

    // Test auth configuration
    const { data: authConfig, error: authError } = await supabase.auth.getSession();
    
    console.log('[DEBUG] Auth configuration test:', { 
      hasSession: !!authConfig.session,
      authError 
    });

    return NextResponse.json({
      status: 'ok',
      dbTest,
      dbError,
      authConfig: !!authConfig,
      authError
    });
  } catch (error) {
    console.error('[DEBUG] Error testing Supabase connection:', error);
    return NextResponse.json({ error: 'Failed to test connection' }, { status: 500 });
  }
} 