// lib/messageGenerator.ts
// This file is used to handle the message generator
// It is used to generate a message based on the theme id

import { MESSAGE_THEMES } from '@/types/messageTypes'

const FALLBACK_MESSAGES = {
  faith: "Trust in the Lord with all your heart. He will guide your path. - Proverbs 3:5-6",
  // ... (other fallback messages)
}

export async function generateMessage(themeId: string): Promise<string> {
  const theme = MESSAGE_THEMES.find(t => t.id === themeId)
  if (!theme) {
    return FALLBACK_MESSAGES[themeId as keyof typeof FALLBACK_MESSAGES] ||
           "May God's love guide and strengthen you today. - Philippians 4:7"
  }

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: theme.prompt,
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
    return FALLBACK_MESSAGES[themeId as keyof typeof FALLBACK_MESSAGES] ||
           "May God's love guide and strengthen you today. - Philippians 4:7"
  }
} 