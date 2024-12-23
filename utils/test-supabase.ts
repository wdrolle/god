import { supabase } from '@/lib/supabaseClient'

export async function testSupabaseConnection() {
  console.log('Testing Supabase Connection');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Anon Key (first 10 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10));

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase Connection Error:', error);
      return false;
    }
    console.log('Supabase Connection Successful');
    return true;
  } catch (err) {
    console.error('Supabase Test Error:', err);
    return false;
  }
} 