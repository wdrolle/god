import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { phone_number, ip_address } = await request.json()
  
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('messaging_consent')
      .insert([
        {
          user_id: user?.id,
          phone_number,
          consent_method: 'web_form',
          consent_url: process.env.NEXT_PUBLIC_MESSAGING_CONSENT_URL,
          ip_address,
        }
      ])
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: 'Error storing consent' }, { status: 500 })
  }
}