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
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Force dynamic rendering and use Node.js runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET Handler - Fetch User's Conversations
 * 
 * Flow:
 * 1. Verify authentication
 * 2. Get god_users record for auth user
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get god_user for the auth user
    const godUser = await prisma.god_users.findFirst({
      where: {
        auth_user_id: session.user.id
      }
    });

    if (!godUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch conversations with messages
    const conversations = await prisma.god_chat_conversations.findMany({
      where: {
        user_id: godUser.id
      },
      include: {
        god_chat_messages: {
          orderBy: {
            created_at: 'asc'
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST Handler - Create New Conversation
 * 
 * Flow:
 * 1. Verify authentication
 * 2. Get god_users record for auth user
 * 3. Create new conversation
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
    // Get server session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Start transaction
    const conversation = await prisma.$transaction(async (tx) => {
      // Get god_user using email from session
      const godUser = await tx.god_users.findFirst({
        where: { 
          email: session.user.email as string
        }
      });

      if (!godUser) {
        console.error('God user not found for email:', session.user.email);
        throw new Error('User not found');
      }

      // Create conversation
      return await tx.god_chat_conversations.create({
        data: {
          user_id: godUser.id,
          title: "New Conversation",
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { 
        error: "Failed to create conversation", 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
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