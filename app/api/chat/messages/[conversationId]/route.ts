import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "../../../../../lib/prisma";
import { ChatMessage } from "@/types/chat";

export async function GET(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await prisma.$queryRaw<ChatMessage[]>`
      SELECT m.*
      FROM god.god_chat_messages m
      JOIN god.god_chat_conversations c ON c.id = m.conversation_id
      WHERE c.user_id = ${user.id}::uuid
        AND m.conversation_id = ${params.conversationId}::uuid
      ORDER BY m.created_at ASC
    `;

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
} 