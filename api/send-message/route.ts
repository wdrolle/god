import { NextResponse } from 'next/server'
import twilio from 'twilio'
import type { NextRequest } from 'next/server'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

async function generateMessage(prompt: string) {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: prompt,
        stream: false
      }),
    })

    const data = await response.json()
    return data.response
  } catch (error) {
    console.error('Error calling Ollama:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    const prompt = `As a spiritual guide, provide a short, meaningful message (max 200 characters) that helps someone grow closer to God. Include a relevant Bible verse.`

    const response = await generateMessage(prompt)

    await client.messages.create({
      body: response,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER!,
    })

    return NextResponse.json({ success: true, message: 'Message sent successfully' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
} 