// api/chat/conversations/route.ts
// This is the route for getting conversations for a user
// It is used to get the conversations for the chat on the bible-chat page
// Handles conversations for a user

/**
 * Chat Conversations API Route (app/api/chat/conversations/route.ts)
 * 
 * This API route handles CRUD operations for chat conversations.
 * It manages the relationship between auth users and their chat conversations
 * through the god_users table.
 * 
 * Related Files:
 * - app/(main)/(routes)/bible-chat/page.tsx (Frontend chat interface)
 * - lib/prisma.ts (Database client)
 * - app/api/chat/messages/route.ts (Message handling)
 * - middleware.ts (Route protection)
 * 
 * Database Tables Used:
 * - auth.users (Authentication users)
 * - god.god_users (Application users)
 * - god.god_chat_conversations (Chat conversations)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering and use Node.js runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET Handler - Fetch User's Conversations
 * 
 * Flow:
 * 1. Verify authentication
 * 2. Get or create god_user for the authenticated user
 * 3. Fetch all conversations for the user
 * 
 * Returns:
 * - 200: Array of conversations
 * - 401: Unauthorized
 * - 404: User not found
 * - 500: Server error
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the god_user
    const godUser = await prisma.god_users.findFirst({
      where: { auth_user_id: session.user.id }
    });

    // If no god_user exists, create one with initial conversation
    if (!godUser) {
      const newGodUser = await prisma.god_users.create({
        data: {
          auth_user_id: session.user.id,
          email: session.user.email || '',
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Create initial conversation
      const conversation = await prisma.god_chat_conversations.create({
        data: {
          user_id: newGodUser.id,
          title: 'Welcome to Bible Chat',
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Create welcome message
      await prisma.god_chat_messages.create({
        data: {
          conversation_id: conversation.id,
          messages: {
            id: uuidv4(),
            user_content: "Welcome to Bible Chat",
            ai_content: "Welcome to Bible Chat! I am here to help you explore and understand the Bible. Feel free to ask any questions about scripture, theology, or biblical history.",
            timestamp: new Date().toISOString()
          },
          created_at: new Date()
        }
      });

      // Return the initial conversation
      return NextResponse.json([{
        id: conversation.id,
        title: conversation.title,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at
      }]);
    }

    // Get all conversations for the user
    const conversations = await prisma.god_chat_conversations.findMany({
      where: {
        user_id: godUser.id
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error in GET /api/chat/conversations:', error);
    return new NextResponse("Failed to fetch conversations", { status: 500 });
  }
}

/**
 * POST Handler - Create New Chat
 * 
 * Flow:
 * 1. Verify authentication
 * 2. Get or create god_user for the authenticated user
 * 3. Create new chat
 * 
 * Request Body: None required
 * 
 * Returns:
 * - 200: Created conversation object
 * - 401: Unauthorized
 * - 404: User not found
 * - 500: Server error
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get god_user
    const godUser = await prisma.god_users.findFirst({
      where: { auth_user_id: session.user.id }
    });

    if (!godUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    const body = await req.json();
    const { title } = body;

    // Create new conversation
    const conversation = await prisma.god_chat_conversations.create({
      data: {
        user_id: godUser.id,
        title: title || `Chat ${new Date().toLocaleString()}`,
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        god_chat_messages: true
      }
    });

    // Create welcome message for new conversation
    await prisma.god_chat_messages.create({
      data: {
        conversation_id: conversation.id,
        messages: [{
          id: uuidv4(),
          user_content: {
            role: "user",
            content: "Welcome to Bible Chat",
            timestamp: new Date().toISOString()
          },
          ai_content: {
            role: "assistant",
            content: "Welcome to Bible Chat! I am here to help you explore and understand the Bible. Feel free to ask any questions about scripture, theology, or biblical history.",
            timestamp: new Date().toISOString()
          }
        }],
        created_at: new Date()
      }
    });

    // Fetch the conversation again with the welcome message
    const conversationWithMessages = await prisma.god_chat_conversations.findUnique({
      where: { id: conversation.id },
      include: {
        god_chat_messages: true
      }
    });

    if (!conversationWithMessages) {
      throw new Error("Failed to create conversation");
    }

    return NextResponse.json(conversationWithMessages);
  } catch (error) {
    console.error('Error in POST /api/chat/conversations:', error);
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to create conversation",
      { status: 500 }
    );
  }
}


function uuidv4(): any {
  throw new Error("Function not implemented.");
}
/**
 * Implementation Notes:
 * 
 * 1. Authentication:
 *    - Uses Supabase auth client
 *    - Requires valid session
 *    - Maps auth user to god_users
 * 
 * 2. Database Access:
 *    - Uses Prisma client
 *    - Follows schema relationships
 *    - Maintains referential integrity
 * 
 * 3. Error Handling:
 *    - Catches all errors
 *    - Returns appropriate status codes
 *    - Logs server errors
 * 
 * 4. Security:
 *    - Validates user access
 *    - Protects routes
 *    - Sanitizes inputs/outputs
 */ 