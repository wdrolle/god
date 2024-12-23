// app/api/debug/route.ts
// This is the route for debugging
// It is used to debug the application
// Handles debugging the application

import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
    sidPrefix: process.env.TWILIO_ACCOUNT_SID?.slice(0, 2),
    hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
  })
} 