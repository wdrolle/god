import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
    sidPrefix: process.env.TWILIO_ACCOUNT_SID?.slice(0, 2),
    hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
  })
} 