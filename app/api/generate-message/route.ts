// app/api/generate-message/route.ts
// This is the route for generating a message
// It is used to generate a message for a user
// Handles generating a message

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt, conversationId, previousMessages, model, temperature, maxTokens } = await req.json();

    // Call Llama model through your Ollama endpoint
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: formatPrompt(prompt, previousMessages),
        temperature: temperature || 0.7,
        max_tokens: maxTokens || 2000,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate response from Llama');
    }

    const data = await response.json();
    return NextResponse.json({ message: data.response });

  } catch (error) {
    console.error('Error in generate-message:', error);
    return NextResponse.json(
      { error: "Failed to generate message" },
      { status: 500 }
    );
  }
}

function formatPrompt(prompt: string, previousMessages: any[] = []): string {
  // Format conversation history for Llama
  const history = previousMessages
    .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  return `${history}\nHuman: ${prompt}\nAssistant:`;
} 