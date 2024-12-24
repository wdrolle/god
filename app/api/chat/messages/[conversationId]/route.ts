// api/chat/messages/[conversationId]/route.ts
// This is the route for getting messages for a specific conversation
// It is used to get the messages for the chat on the bible-chat page
// Handles messages for a conversation

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at: Date | string;
}

export async function GET(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get god_user
    const godUser = await prisma.god_users.findFirst({
      where: { auth_user_id: session.user.id }
    });

    if (!godUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user owns the conversation
    const conversation = await prisma.god_chat_conversations.findFirst({
      where: {
        id: params.conversationId,
        user_id: godUser.id
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get messages with EST timestamps
    const messages = await prisma.god_chat_messages.findMany({
      where: {
        conversation_id: params.conversationId
      },
      orderBy: {
        created_at: 'asc'
      },
      select: {
        role: true,
        content: true,
        created_at: true
      }
    });

    // Convert timestamps to EST
    const messagesWithEST = messages.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
      created_at: new Date(msg.created_at!)
        .toLocaleString('en-US', { timeZone: 'America/New_York' })
    }));

    return NextResponse.json(messagesWithEST);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
} 