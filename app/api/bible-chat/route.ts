// api/bible-chat/route.ts
// This is the route for getting a response from the bible-chat
// It is used to get the response for the bible-chat on the bible-chat page
// Handles getting a response from the bible-chat

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateResponse } from "@/lib/utils/ollama";
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId } = await req.json();

    // Create conversation if none exists
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const conversation = await prisma.god_chat_conversations.create({
        data: {
          user_id: user.id,
          title: "New Conversation",
        },
      });
      activeConversationId = conversation.id;
    }

    // Get user's preferences and generate response
    const userData = await prisma.god_users.findUnique({
      where: { id: user.id },
      include: {
        preferences: {
          select: { preferred_bible_version: true }
        }
      }
    });

    const bibleVersion = userData?.preferences?.preferred_bible_version || "NIV";
    const prompt = `You are a helpful Christian AI assistant. Using the ${bibleVersion} Bible version, 
      please provide guidance and biblical references for the following question: ${message}
      Please include relevant Bible verses and their references.`;

    // Get AI response first
    const aiResponse = await generateResponse(prompt);

    // Then use transaction to save everything
    await prisma.$transaction(async (tx) => {
      // Save user message
      await tx.god_chat_messages.create({
        data: {
          conversation_id: activeConversationId,
          role: "user",
          content: message,
        },
      });

      // Save AI response
      await tx.god_chat_messages.create({
        data: {
          conversation_id: activeConversationId,
          role: "assistant",
          content: aiResponse,
        },
      });

      // Update conversation timestamp
      await tx.god_chat_conversations.update({
        where: { id: activeConversationId },
        data: { updated_at: new Date() },
      });
    });

    return NextResponse.json({ message: aiResponse });
  } catch (error) {
    console.error("Bible Chat error:", error);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
} 