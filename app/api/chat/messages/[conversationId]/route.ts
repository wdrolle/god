// api/chat/messages/[conversationId]/route.ts
// This is the route for getting messages for a specific conversation
// It is used to get the messages for the chat on the bible-chat page
// Handles messages for a conversation

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns the conversation
    const conversation = await prisma.god_chat_conversations.findFirst({
      where: {
        id: params.conversationId,
        user_id: session.user.id
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get messages
    const messages = await prisma.god_chat_messages.findMany({
      where: {
        conversation_id: params.conversationId
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
} 