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

// Force dynamic rendering and use Node.js runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId } = await req.json();

    // Conversation management
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

    // User preferences retrieval
    const userData = await prisma.god_user_preferences.findUnique({
      where: { user_id: user.id },
      select: {
        preferred_bible_version: true,
        theme_preferences: true,
        message_length_preference: true,
        blocked_themes: true
      }
    });

    // AI response generation
    const bibleVersion = userData?.preferred_bible_version || 'NIV';
    const prompt = `You are a helpful Christian AI assistant. Using the ${bibleVersion} Bible version, 
      please provide guidance and biblical references for the following question: ${message}
      Please include relevant Bible verses and their references.`;

    const aiResponse = await generateResponse(prompt);

    // Database transaction for message saving
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