import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId } = await req.json();

    // Get god_user details
    const godUser = await prisma.god_users.findFirst({
      where: { auth_user_id: session.user.id }
    });

    if (!godUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const timestamp = new Date().toISOString();
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Increase transaction timeout to 30 seconds
    const result = await prisma.$transaction(async (tx) => {
      // Check if conversation exists and belongs to user
      let conversation = await tx.god_chat_conversations.findFirst({
        where: {
          id: conversationId,
          user_id: godUser.id
        }
      });

      // If conversation doesn't exist, create it
      if (!conversation) {
        conversation = await tx.god_chat_conversations.create({
          data: {
            id: conversationId,
            user_id: godUser.id,
            title: message.slice(0, 30) + "...",
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      }

      // Get AI response first before database operations
      const response = await fetch('http://localhost:3000/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are a wise and compassionate theologian speaking to ${godUser.first_name}. Your name is Zoe, meaning "Life", Significance of your name represents divine strength and guidance.
Their question is: "${message}"

Provide a thoughtful, pastoral response that:
1. Directly addresses their specific question or concern
2. Includes relevant Bible verses (with references)
3. Offers practical spiritual guidance and encouragement
4. Explains theological concepts in an accessible way
5. Maintains a warm, personal tone
6. End your message with \n\n---\nWalking with you in faith,\nZoe 🙏`,
          themeId: 'faith',
          userContext: {
            firstName: godUser.first_name,
            lastName: godUser.last_name,
            subscriptionStatus: godUser.subscription_status,
            role: godUser.role
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate message');
      }

      const data = await response.json();
      
      if (!data.message) {
        throw new Error('No message received from AI');
      }

      const formattedResponse = `${data.message}`;

      // Save messages to database
      const messageData = {
        role: 'user',
        content: message,
        timestamp: timestamp,
        user_id: godUser.id,
        first_name: godUser.first_name,
        last_name: godUser.last_name,
        email: godUser.email,
        phone: godUser.phone,
        ip_address: ipAddress,
        subscription_status: godUser.subscription_status
      };

      const aiMessageData = {
        role: 'assistant',
        content: formattedResponse,
        timestamp: timestamp,
        user_id: godUser.id,
        first_name: godUser.first_name,
        last_name: godUser.last_name,
        email: godUser.email,
        phone: godUser.phone,
        ip_address: ipAddress,
        subscription_status: godUser.subscription_status
      };

      // Find existing messages
      const existingUserMessage = await tx.god_chat_messages.findFirst({
        where: {
          conversation_id: conversationId,
          role: 'user'
        }
      });

      const existingAiMessage = await tx.god_chat_messages.findFirst({
        where: {
          conversation_id: conversationId,
          role: 'assistant'
        }
      });

      // Update or create user message
      if (existingUserMessage) {
        const currentMessages = existingUserMessage.messages as any[];
        await tx.god_chat_messages.update({
          where: { id: existingUserMessage.id },
          data: {
            content: message,
            messages: [...currentMessages, messageData]
          }
        });
      } else {
        await tx.god_chat_messages.create({
          data: {
            conversation_id: conversationId,
            role: 'user',
            content: message,
            created_at: new Date(),
            messages: [messageData]
          }
        });
      }

      // Update or create AI message
      if (existingAiMessage) {
        const currentMessages = existingAiMessage.messages as any[];
        await tx.god_chat_messages.update({
          where: { id: existingAiMessage.id },
          data: {
            content: formattedResponse,
            messages: [...currentMessages, aiMessageData]
          }
        });
      } else {
        await tx.god_chat_messages.create({
          data: {
            conversation_id: conversationId,
            role: 'assistant',
            content: formattedResponse,
            created_at: new Date(),
            messages: [aiMessageData]
          }
        });
      }

      // Update conversation timestamp
      await tx.god_chat_conversations.update({
        where: { id: conversationId },
        data: { updated_at: new Date() }
      });

      return { message: formattedResponse };
    }, {
      timeout: 30000 // 30 second timeout
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in chat messages route:', error);
    return NextResponse.json(
      { error: error.message || "Failed to process message" },
      { status: 500 }
    );
  }
} 