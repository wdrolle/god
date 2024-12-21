import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "../../../../../lib/prisma";
import { ChatConversation } from "@/types/chat";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await req.json();

    const [conversation] = await prisma.$queryRaw<ChatConversation[]>`
      UPDATE god.god_chat_conversations
      SET title = ${title}, updated_at = NOW()
      WHERE id = ${params.id}::uuid AND user_id = ${user.id}::uuid
      RETURNING *
    `;

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
} 