// app/api/generate-message/route.ts
// This is the route for generating a message
// It is used to generate a message for a user
// Handles generating a message

import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt, themeId } = await req.json();

    // Call Llama model through your Ollama endpoint
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: prompt,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate response from Llama');
    }

    const data = await response.json();
    
    if (!data.response) {
      throw new Error('No response received from AI');
    }

    return NextResponse.json({
      success: true,
      message: data.response
    });

  } catch (error) {
    console.error('Error in generate-message:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate message'
    }, { status: 500 });
  }
} 