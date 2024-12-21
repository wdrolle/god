// app/api/login/route.ts

import { NextResponse } from 'next/server';
import { FormSchema } from '@/lib/types';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the form data using Zod
    const validatedData = FormSchema.parse(body);

    // Check if environment variables are set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase environment variables are not set.');
      return NextResponse.json(
        { error: 'Internal server error.' },
        { status: 500 }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Attempt to sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    // Handle authentication errors
    if (error) {
      console.error('Supabase auth error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 400 }
      );
    }

    // Return the session data if successful
    return NextResponse.json({ session: data.session }, { status: 200 });
  } catch (error: any) {
    console.error('Login error:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'An unexpected error occurred';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}