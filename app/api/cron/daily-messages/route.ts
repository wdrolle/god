import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import twilio from 'twilio'
import { generateMessage } from '@/lib/messageGenerator'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function GET(request: Request) {
  try {
    // Get active subscriptions with their themes
    const { data: subscriptions, error: subError } = await supabase
      .from('god_subscriptions')
      .select(`
        *,
        themes:god_subscription_themes(theme_id)
      `)
      .eq('active', true)

    if (subError) throw subError
    if (!subscriptions?.length) {
      return NextResponse.json({ error: 'No active subscriptions found' })
    }

    // Send message to each subscriber
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          // Generate message for each subscription's theme
          const themeId = sub.themes?.[0]?.theme_id || 'faith' // Default to faith theme
          const message = await generateMessage(themeId)

          // Send SMS
          const twilioMessage = await client.messages.create({
            body: message,
            to: sub.phone_number,
            from: process.env.TWILIO_PHONE_NUMBER
          })

          // Record sent message
          await supabase.from('god_sent_messages').insert([{
            phone_number: sub.phone_number,
            message: message,
            theme_id: themeId,
            twilio_sid: twilioMessage.sid,
            sent_at: new Date().toISOString()
          }])

          return { success: true, phone: sub.phone_number }
        } catch (error) {
          console.error(`Failed to send to ${sub.phone_number}:`, error)
          return { success: false, phone: sub.phone_number, error }
        }
      })
    )

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Daily message error:', error)
    return NextResponse.json({ error: 'Failed to process daily messages' }, { status: 500 })
  }
} 1
