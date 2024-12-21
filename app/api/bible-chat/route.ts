import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { generateResponse } from "../../../lib/utils/ollama";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId } = await req.json();

    // Get user's preferences
    const userData = await prisma.god_users.findUnique({
      where: { id: user.id },
      include: {
        preferences: {
          select: { preferred_bible_version: true }
        }
      }
    });

    const bibleVersion = userData?.preferences?.preferred_bible_version || "NIV";
    const prompt = `You are a helpful Christian AI assistant. Using the ${bibleVersion} Bible version, 
      please provide guidance and biblical references for the following question: ${message}
      Please include relevant Bible verses and their references.`;

    // Save user message
    await prisma.$executeRaw`
      INSERT INTO god.god_chat_messages (conversation_id, role, content)
      VALUES (${conversationId}::uuid, 'user', ${message})
    `;

    // Get AI response
    const aiResponse = await generateResponse(prompt);

    // Save AI response
    await prisma.$executeRaw`
      INSERT INTO god.god_chat_messages (conversation_id, role, content)
      VALUES (${conversationId}::uuid, 'assistant', ${aiResponse})
    `;

    // Update conversation timestamp
    await prisma.$executeRaw`
      UPDATE god.god_chat_conversations
      SET updated_at = NOW()
      WHERE id = ${conversationId}::uuid
    `;

    return NextResponse.json({ message: aiResponse });
  } catch (error) {
    console.error("Bible Chat error:", error);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
} 