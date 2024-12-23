// api/chat/conversations/route.ts
// This is the route for getting conversations for a user
// It is used to get the conversations for the chat on the bible-chat page
// Handles conversations for a user

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// This is required for Next.js API routes
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.god_chat_conversations.findMany({
      where: {
        user_id: user.id,
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

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

    const conversation = await prisma.god_chat_conversations.create({
      data: {
        user_id: user.id,
        title: "New Chat",
      },
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
} 