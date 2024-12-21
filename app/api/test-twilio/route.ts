import { NextResponse } from 'next/server'
import twilio from 'twilio'

export async function GET() {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN

  if (!twilioAccountSid || !twilioAuthToken) {
    return NextResponse.json({
      success: false,
      error: 'Missing Twilio credentials',
    }, { status: 500 })
  }

  const client = twilio(twilioAccountSid, twilioAuthToken)

  try {
    // Test Twilio credentials by getting account info
    const account = await client.api.accounts(twilioAccountSid).fetch()
    
    return NextResponse.json({
      success: true,
      status: account.status,
      type: account.type,
      friendlyName: account.friendlyName,
    })
  } catch (error) {
    console.error('Twilio test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test Twilio connection',
    }, { status: 500 })
  }
} 