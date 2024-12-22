// app/api/user/preferences/emails/route.ts
// This is the route for getting the banks for a user
// It is used to get the banks for a user
// Handles getting the banks for a user

import { NextResponse } from 'next/server';
import { validate as isUUID } from 'uuid';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Get the session from the request header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate userId as UUID
    if (!isUUID(user.id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Fetch user data from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle email data
    const emailIds: string[] = Array.isArray(userData.email)
      ? userData.email.filter((id): id is string => typeof id === 'string')
      : typeof userData.email === 'string'
      ? [userData.email]
      : [];

    // Type guard to filter only valid UUID strings
    const validEmailIds = emailIds.filter(isUUID);

    // Fetch email details
    const { data: emails, error: emailsError } = await supabase
      .from('users')
      .select('id, email')
      .in('id', validEmailIds);

    if (emailsError) {
      throw emailsError;
    }

    return NextResponse.json({ emails });
  } catch (error) {
    console.error('Error fetching user emails:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}