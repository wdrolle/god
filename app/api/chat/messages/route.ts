import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId } = await req.json();
    
    // Get AI response from generate-message endpoint
    const response = await fetch('http://localhost:3000/api/generate-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `Create an inspiring spiritual message about ${message}. Include a relevant Bible verse.`,
        themeId: 'faith'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate message in the chat message route.');
    }

    const data = await response.json();
    
    if (!data.message) {
      throw new Error('No message received from AI');
    }

    // Format the response in markdown
    const formattedResponse = `
### Divine Guidance

${data.message}

---
*Walking with you in faith 🙏*
    `.trim();

    // Save both messages to database
    await prisma.god_chat_messages.create({
      data: {
        conversation_id: conversationId,
        role: 'user',
        content: message,
        created_at: new Date()
      }
    });

    const savedAiMessage = await prisma.god_chat_messages.create({
      data: {
        conversation_id: conversationId,
        role: 'assistant',
        content: formattedResponse,
        created_at: new Date()
      }
    });

    return NextResponse.json({ 
      message: formattedResponse,
      messageId: savedAiMessage.id
    });

  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat message' },
      { status: 500 }
    );
  }
} 