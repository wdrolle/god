// lib/api-client.ts
// This file is used to handle the API client for the application
// It is used to handle the API client for the application

import { supabase } from "./supabaseClient";

const BASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE;

interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    status?: number;
  };
}

async function checkConnection(): Promise<boolean> {
  try {
    // Try auth endpoint instead of health
    const response = await fetch(`${BASE_URL}/auth/v1/`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY!
      }
    });
    
    console.log('[DEBUG] Connection check response:', {
      status: response.status,
      ok: response.ok
    });
    
    return response.ok;
  } catch (error) {
    console.error('[DEBUG] Connection check failed:', error);
    return false;
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 2000
): Promise<Response> {
  let lastError: Error = new Error('No attempts made yet');
  
  for (let i = 0; i <= retries; i++) {
    try {
      // Check connection before each attempt
      const isConnected = await checkConnection();
      if (!isConnected) {
        console.log('[DEBUG] Connection check failed, waiting before retry');
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok || i === retries) {
        return response;
      }
      lastError = new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < retries) {
        const waitTime = delay * Math.pow(2, i); // Exponential backoff
        console.log(`[DEBUG] API retry attempt ${i + 1}/${retries}, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error('[DEBUG] All retry attempts failed:', {
    url,
    error: lastError.message
  });
  throw lastError;
}

export async function createUser(email: string, password: string): Promise<ApiResponse<any>> {
  try {
    // First try direct auth endpoint with retry
    const authResponse = await fetchWithRetry(
      `${BASE_URL}/auth/v1/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY!,
          'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify({
          email,
          password,
          data: {
            email_confirm: true
          }
        })
      },
      5, // More retries
      3000 // Longer initial delay
    );

    const authData = await authResponse.json();
    console.log('[DEBUG] Auth response:', authData);

    if (!authResponse.ok) {
      throw new Error(authData.error?.message || 'Failed to create user');
    }

    // Then create user profile using RPC
    const profileResponse = await fetchWithRetry(
      `${BASE_URL}/rest/v1/rpc/insert_god_user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY!,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          p_email: email,
          p_auth_user_id: authData.user.id
        })
      }
    );

    const profileData = await profileResponse.json();
    console.log('[DEBUG] Profile creation response:', profileData);

    if (!profileResponse.ok) {
      console.error('[DEBUG] Failed to create profile:', {
        status: profileResponse.status,
        error: profileData,
        headers: Object.fromEntries(profileResponse.headers)
      });
      throw new Error('Failed to create user profile');
    }

    return { data: authData };
  } catch (error) {
    console.error('[DEBUG] API error:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      error: {
        message: error instanceof Error 
          ? error.message 
          : 'Unable to complete signup. Please try again later.',
        status: 500
      }
    };
  }
} 

export async function getTrialStatus(userId?: string) {
  const { data, error } = await supabase
    .rpc('get_trial_status', userId ? { p_user_id: userId } : {});
    
  if (error) throw error;
  return data;
} 