// api/chat/conversations/[id]/route.ts
// This is the route for upserting a conversation

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return new NextResponse("Invalid title", { status: 400 });
    }

    // Update conversation
    const updatedConversation = await prisma.god_chat_conversations.update({
      where: {
        id: params.id,
        user_id: session.userId
      },
      data: { 
        title: title.trim(),
        updated_at: new Date()
      }
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error('Error in PATCH /api/chat/conversations/[id]:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify conversation exists and belongs to the user
    const conversation = await prisma.god_chat_conversations.findFirst({
      where: {
        id: params.id,
        user_id: session.userId
      }
    });

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    // Delete the conversation (cascade delete will handle messages)
    await prisma.god_chat_conversations.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/chat/conversations/[id]:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}