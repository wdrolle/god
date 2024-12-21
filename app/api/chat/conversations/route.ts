import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import { ChatConversation } from "@/types/chat";

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.$queryRaw<ChatConversation[]>`
      SELECT *
      FROM god.god_chat_conversations
      WHERE user_id = ${user.id}::uuid
      ORDER BY updated_at DESC
    `;

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, verify user exists in god_users table
    const dbUser = await prisma.god_users.findUnique({
      where: { id: user.id }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [conversation] = await prisma.$queryRaw<ChatConversation[]>`
      INSERT INTO god.god_chat_conversations (user_id, title)
      VALUES (${dbUser.id}::uuid, 'New Conversation')
      RETURNING *
    `;

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
} 