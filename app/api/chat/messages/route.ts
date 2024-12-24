import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface MessageRequest {
  conversation_id: string;
  messages: ChatMessage[];
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversation_id, messages }: MessageRequest = await req.json();

    // Verify user owns the conversation
    const conversation = await prisma.god_chat_conversations.findFirst({
      where: {
        id: conversation_id,
        user_id: session.user.id
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Save messages in transaction
    const savedMessages = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const msg of messages) {
        const saved = await tx.god_chat_messages.create({
          data: {
            conversation_id,
            role: msg.role,
            content: msg.content,
            created_at: new Date(msg.created_at)
          }
        });
        results.push(saved as any);
      }
      
      return results;
    });

    return NextResponse.json(savedMessages);
  } catch (error) {
    console.error('Error saving messages:', error);
    return NextResponse.json(
      { error: "Failed to save messages" },
      { status: 500 }
    );
  }
} 