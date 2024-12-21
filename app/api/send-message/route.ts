import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { supabase } from '@/lib/supabase'

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

const client = twilio(twilioAccountSid, twilioAuthToken)

export async function POST(request: Request) {
  try {
    const { phoneNumber, message, themeId } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    console.log('Attempting to send message:', {
      to: phoneNumber,
      from: twilioPhoneNumber,
      messageLength: message?.length,
      themeId
    })

    // First, try to save to database
    try {
      const { error: templateError } = await supabase
        .from('god_message_templates')
        .insert([{
          theme_id: themeId,
          prompt: message,
          message: message,
          character_count: message.length,
          active: true,
          times_used: 1,
          last_used_at: new Date().toISOString()
        }])

      if (templateError) {
        console.error('Database error saving template:', templateError)
      }
    } catch (dbError) {
      console.error('Failed to save template:', dbError)
    }

    // Send SMS via Twilio
    let twilioMessage
    try {
      twilioMessage = await client.messages.create({
        body: message,
        to: phoneNumber,
        from: twilioPhoneNumber,
      })
      
      console.log('Twilio message sent successfully:', twilioMessage.sid)
    } catch (twilioError) {
      console.error('Twilio error:', twilioError)
      return NextResponse.json({
        success: false,
        error: 'Failed to send SMS',
        details: twilioError instanceof Error ? twilioError.message : 'Unknown Twilio error'
      }, { status: 500 })
    }

    // Save sent message to database
    if (twilioMessage) {
      try {
        const { error: sentError } = await supabase
          .from('god_sent_messages')
          .insert([{
            phone_number: phoneNumber,
            message: message,
            theme_id: themeId,
            twilio_sid: twilioMessage.sid,
            status: 'SENT',
            sent_at: new Date().toISOString()
          }])

        if (sentError) {
          console.error('Database error saving sent message:', sentError)
        }
      } catch (dbError) {
        console.error('Failed to save sent message:', dbError)
      }
    }

    return NextResponse.json({
      success: true,
      messageId: twilioMessage?.sid,
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process request',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
} 