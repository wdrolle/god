// api/chat/messages/[conversationId]/route.ts
// This is the route for getting messages for a specific conversation
// It is used to get the messages for the chat on the bible-chat page
// Handles messages for a conversation

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Add rate limiting and caching with per-conversation tracking
const rateLimit = new Map<string, { [key: string]: number }>();
const messageCache = new Map<string, { data: any; timestamp: number }>();

export async function GET(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const conversationId = params.conversationId;
    if (!conversationId) {
      return new NextResponse("Conversation ID required", { status: 400 });
    }

    // Initialize rate limit tracking for user if not exists
    if (!rateLimit.has(session.user.id)) {
      rateLimit.set(session.user.id, {});
    }

    const userRateLimit = rateLimit.get(session.user.id)!;
    const now = Date.now();

    // Check rate limit per conversation
    if (userRateLimit[conversationId] && (now - userRateLimit[conversationId]) < 2000) { // 2 second cooldown
      // Check cache before rejecting
      const cacheKey = `${session.user.id}:${conversationId}`;
      const cached = messageCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < 30000) { // 30 second cache
        return NextResponse.json(cached.data);
      }
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    // Update rate limit timestamp
    userRateLimit[conversationId] = now;

    // Get the god_user
    const godUser = await prisma.god_users.findFirst({
      where: { auth_user_id: session.user.id }
    });

    if (!godUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Verify the conversation belongs to the user
    const conversation = await prisma.god_chat_conversations.findFirst({
      where: {
        id: conversationId,
        user_id: godUser.id
      }
    });

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    // Get messages for the conversation
    const messages = await prisma.god_chat_messages.findMany({
      where: {
        conversation_id: conversationId
      },
      select: {
        id: true,
        messages: true,
        created_at: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    // Cache the result
    const cacheKey = `${session.user.id}:${conversationId}`;
    messageCache.set(cacheKey, {
      data: messages,
      timestamp: now
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error in GET /api/chat/messages:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 