// File: /app/api/signup/route.ts
// This is the route for signing up a user

import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, first_name, last_name, phone } = await request.json()
    const supabase = createClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          phone
        }
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // Create user profile in your database
    const { data: userData, error: userError } = await supabase
      .from('god_users')
      .insert([
        {
          auth_user_id: authData.user?.id,
          email,
          first_name,
          last_name,
          phone,
          role: 'USER'
        }
      ])
      .select()
      .single()

    if (userError) {
      return NextResponse.json(
        { error: userError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      user: userData,
      message: 'Check your email to confirm your account'
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
