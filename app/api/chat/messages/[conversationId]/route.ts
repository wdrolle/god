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

// Add rate limiting constants
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;
const requestCounts = new Map<string, { count: number; timestamp: number }>();

// Clean up old rate limit entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW) {
      requestCounts.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

// Rate limiting middleware
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(userId);

  if (!userRequests || now - userRequests.timestamp > RATE_LIMIT_WINDOW) {
    requestCounts.set(userId, { count: 1, timestamp: now });
    return true;
  }

  if (userRequests.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  userRequests.count++;
  return true;
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

    // Check rate limit
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
            'X-RateLimit-Reset': (Date.now() + RATE_LIMIT_WINDOW).toString()
          }
        }
      );
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
      }
    });

    // Separate user and AI messages
    const userMessages = messages.find(msg => msg.role === 'user')?.messages || [];
    const aiMessages = messages.find(msg => msg.role === 'assistant')?.messages || [];

    // Combine and sort all messages
    const allMessages = [...userMessages, ...aiMessages].sort((a: any, b: any) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Convert timestamps to EST and format messages
    const messagesWithEST = allMessages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      created_at: new Date(msg.timestamp)
        .toLocaleString('en-US', { timeZone: 'America/New_York' })
    }));

    // Add cache control headers
    const headers = {
      'Cache-Control': 'private, max-age=10'
    };

    console.log('Fetched messages:', JSON.stringify(messagesWithEST, null, 2));
    return NextResponse.json(messagesWithEST, { headers });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
} 