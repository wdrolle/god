import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('x-scheduled-job')
  
  if (authHeader !== process.env.SCHEDULED_JOB_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('phone_number')

    if (error) throw error

    for (const subscriber of subscribers || []) {
      await fetch(new URL('/api/send-message', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: subscriber.phone_number }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to process scheduled messages' },
      { status: 500 }
    )
  }
} 