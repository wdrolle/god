// api/bible-chat/route.ts
// This is the route for getting a response from the bible-chat
// It is used to get the response for the bible-chat on the bible-chat page
// Handles getting a response from the bible-chat

/**
 * Bible Chat API Route Handler (app/api/bible-chat/route.ts)
 * 
 * This API route handles the Bible chat functionality, including user authentication,
 * conversation management, and AI response generation.
 * 
 * Related Files:
 * - app/(main)/(routes)/bible-chat/page.tsx (Frontend chat interface)
 * - lib/utils/ollama.ts (AI response generation)
 * - lib/prisma.ts (Database client)
 * - app/api/chat/conversations/route.ts (Conversation management)
 * - app/api/chat/messages/route.ts (Message history)
 * - lib/auth.ts (Authentication handling)
 * - middleware.ts (Route protection)
 * 
 * Database Tables Used:
 * - god_chat_conversations (Stores chat conversations)
 * - god_chat_messages (Stores individual messages)
 * - god_user_preferences (User settings)
 * 
 * Key Features:
 * 1. User Authentication
 * 2. Conversation Management
 * 3. User Preferences
 * 4. AI Response Generation
 * 5. Transaction Safety
 */

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateResponse } from "@/lib/utils/ollama";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Force dynamic rendering and use Node.js runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Add this interface at the top of the file
interface GodUser {
  id: string;
  first_name: string | null;
}

/**
 * POST Request Handler
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Create/get conversation
 * 3. Get user preferences
 * 4. Generate AI response
 * 5. Save messages in transaction
 * 
 * Error Handling:
 * - 401: Unauthorized access
 * - 500: Server/Database errors
 * 
 * Request Body:
 * {
 *   message: string;        // User's message
 *   conversationId?: string // Optional existing conversation
 * }
 * 
 * Response:
 * {
 *   message: string;  // AI response
 * }
 */
export async function POST(req: Request) {
  try {
    const { message, conversationId } = await req.json();
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get god_user using Prisma with explicit schema
    const godUser = await prisma.god_users.findFirst({
      where: { auth_user_id: session.user.id },
      select: { id: true, first_name: true }
    });

    if (!godUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate AI response
    const aiResponse = await generateResponse({
      prompt: message,
      firstName: godUser.first_name || "friend"
    });

    const timestamp = new Date().toISOString();

    // Save both messages in transaction
    await prisma.$transaction(async (tx) => {
      // Save user message
      await tx.god_chat_messages.create({
        data: {
          conversation_id: conversationId,
          role: "user",
          content: message,
          created_at: new Date(),
          messages: [{
            role: "user",
            prompt: message,
            content: message,
            timestamp: timestamp
          }]
        }
      });

      // Save AI response
      await tx.god_chat_messages.create({
        data: {
          conversation_id: conversationId,
          role: "assistant",
          content: aiResponse,
          created_at: new Date(),
          messages: [{
            role: "assistant",
            prompt: message,
            content: aiResponse,
            timestamp: timestamp
          }]
        }
      });

      // Update conversation timestamp
      await tx.god_chat_conversations.update({
        where: { id: conversationId },
        data: { updated_at: new Date() }
      });
    });

    return NextResponse.json({ message: aiResponse });
  } catch (error) {
    console.error("Bible Chat error:", error);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
} 