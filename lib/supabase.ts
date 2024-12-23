// lib/supabase.ts
// This file is used to handle the supabase client
// It is used to connect to the supabase database using the supabase service role

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { withRetry } from './utils/retry'
import { createUser } from './api-client'

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}
if (!process.env.SUPABASE_SERVICE_ROLE) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE')
}

// Public client for client-side operations
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'god'
    }
  }
)

// Admin client with service role for direct database operations
export const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    },
    db: {
      schema: 'god'
    },
    global: {
      headers: {
        'x-client-info': 'god-app-admin'
      }
    }
  }
)

export async function signUpUser({
  email,
  password
}: {
  email: string
  password: string
}) {
  try {
    console.log('[DEBUG] Starting signup process for:', email);

    try {
      // Try Supabase client first
      const result = await withRetry(
        async () => {
          // First, verify Supabase connection
          try {
            const { data: healthCheck } = await adminClient.rpc('check_health');
            console.log('[DEBUG] Health check result:', healthCheck);
          } catch (error) {
            console.error('[DEBUG] Health check failed:', error);
            throw new Error('Service temporarily unavailable');
          }

          // First, check if user already exists
          const { data: existingUser, error: checkError } = await adminClient
            .from('god_users')
            .select('email')
            .eq('email', email)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error('[DEBUG] Error checking existing user:', checkError);
            throw checkError;
          }

          if (existingUser) {
            throw new Error('User already exists');
          }

          // Create user in god_users first
          const userId = crypto.randomUUID();
          const { error: userError } = await adminClient
            .from('god_users')
            .insert({
              id: userId,
              email: email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (userError) {
            console.error('[DEBUG] Error creating user in god_users:', userError);
            throw userError;
          }

          try {
            // Now create the auth user
            const { data, error: authError } = await adminClient.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: {
                god_user_id: userId
              }
            });

            if (authError) {
              // Rollback god_users creation if auth fails
              await adminClient
                .from('god_users')
                .delete()
                .eq('id', userId);

              console.error('[DEBUG] Auth creation error:', {
                message: authError.message,
                status: authError.status
              });
              throw authError;
            }

            // Update god_users with auth_user_id
            if (data?.user) {
              const { error: updateError } = await adminClient
                .from('god_users')
                .update({ auth_user_id: data.user.id })
                .eq('id', userId);

              if (updateError) {
                console.error('[DEBUG] Error updating god_users with auth_id:', updateError);
              }
            }

            console.log('[DEBUG] Signup successful:', {
              userId,
              authUserId: data?.user?.id,
              email
            });

            return { data, error: null };
          } catch (error) {
            // Cleanup on auth error
            await adminClient
              .from('god_users')
              .delete()
              .eq('id', userId);
            throw error;
          }
        },
        {
          retries: 2,
          initialDelay: 2000,
          maxDelay: 5000
        }
      );

      return result;
    } catch (supabaseError) {
      console.log('[DEBUG] Supabase client failed, trying direct API:', supabaseError);
      
      // Fall back to direct API
      const apiResult = await createUser(email, password);
      if (apiResult.error) {
        throw new Error(apiResult.error.message);
      }
      
      return { data: apiResult.data, error: null };
    }
  } catch (error) {
    console.error('[DEBUG] Final signup error:', {
      error,
      message: error instanceof Error ? error.message : String(error)
    });
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred')
    };
  }
}
