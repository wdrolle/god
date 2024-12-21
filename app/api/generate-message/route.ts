// app/api/generate-message/route.ts
// This is the route for generating a message
// It is used to generate a message for a user
// Handles generating a message

import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FALLBACK_MESSAGES = {
  faith: "Trust in the Lord with all your heart. He will guide your path. - Proverbs 3:5-6",
  healing: "He heals the brokenhearted and binds up their wounds. - Psalm 147:3",
  purpose: "For I know the plans I have for you, plans to prosper you and not to harm you. - Jeremiah 29:11",
  strength: "I can do all things through Christ who strengthens me. - Philippians 4:13",
  peace: "Peace I leave with you; my peace I give you. Do not let your hearts be troubled. - John 14:27",
  wisdom: "If any of you lacks wisdom, let them ask God, who gives generously to all. - James 1:5",
  love: "Love is patient, love is kind. It does not envy, it does not boast. - 1 Corinthians 13:4",
  gratitude: "Give thanks in all circumstances; for this is God's will for you in Christ Jesus. - 1 Thessalonians 5:18",
  forgiveness: "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you. - Ephesians 4:32",
  perseverance: "Let us not become weary in doing good, for at the proper time we will reap a harvest. - Galatians 6:9"
}

async function generateMessage(prompt: string, themeId: string): Promise<string> {
  try {
    // Try to connect to Ollama
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

    if (!response.ok) {
      throw new Error(`Ollama responded with status: ${response.status}`)
    }

    const data = await response.json()
    return data.response

  } catch (error) {
    console.warn('Failed to generate AI message, using fallback:', error)
    // Return fallback message if AI generation fails
    return FALLBACK_MESSAGES[themeId as keyof typeof FALLBACK_MESSAGES] || 
           "May God's love guide and strengthen you today. - Philippians 4:7"
  }
}

export async function POST(request: Request) {
  try {
    const { prompt, themeId } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const message = await generateMessage(prompt, themeId)

    return NextResponse.json({
      success: true,
      message,
    })

  } catch (error) {
    console.error('Error generating message:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate message',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
} 