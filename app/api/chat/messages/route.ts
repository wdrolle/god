import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from 'uuid';

// Template welcome message
const WELCOME_MESSAGE = {
  user_content: {
    role: "user",
    content: "How do I get closer to God?",
    timestamp: new Date().toISOString()
  },
  ai_content: {
    role: "assistant",
    content: `"Come near to God and He will come near to you." (James 4:8)

Honest Prayer and Reflection
Spend intentional time talking to God. Share your worries, joys, and hopes with Him as you would with a friend who truly understands. Prayer is not just about speaking; it's also about listening quietly for God's gentle guidance. Take moments of silence where you simply wait and open your heart to His presence.

Engage with Scripture
The Bible is a primary way God reveals His character and promises. Reading even a few verses daily—particularly the Psalms or the Gospels—can help you sense God's nearness. Reflect on what you read. Ask yourself, "How can I live out this truth right now?"

Practice Thanksgiving
Cultivate a habit of gratitude. Each day, name a few blessings or events that remind you of God's goodness. By thanking God for both big and small gifts, you train your heart to recognize His presence in every season.

Find God in Community
While personal prayer is vital, it's also important to connect with other believers—through local churches, Bible studies, or small groups. Hearing the stories and wisdom of fellow Christians helps you see God at work in diverse ways.

Seek Daily Obedience
Scripture frequently teaches that as we obey God's commandments, we grow in our love and understanding of Him (John 14:15). Obedience is less about rigid rule-following and more about choosing to align your life with the love and goodness found in God's heart.

Embrace Times of Stillness
In a fast-paced world, stillness is challenging. Yet, "Be still, and know that I am God" (Psalm 46:10) invites us to quiet our minds so we can experience God's peace. Whether through silent prayer, journaling, or simply pausing in nature, stillness nurtures closeness with the Lord.

Remember God's Faithfulness
As you look back on how God has led or comforted you in the past, your confidence in His nearness grows. This memory of His care renews your trust that He will continue guiding you forward.`,
    timestamp: new Date().toISOString()
  }
};

// Function to initialize a new user's chat
async function initializeUserChat(userId: string) {
  const conversationId = uuidv4();
  
  // Create initial conversation
  const conversation = await prisma.god_chat_conversations.create({
    data: {
      id: conversationId,
      user_id: userId,
      title: "Welcome to Bible Chat",
      created_at: new Date(),
      updated_at: new Date()
    }
  });

  // Create welcome message
  await prisma.god_chat_messages.create({
    data: {
      conversation_id: conversationId,
      messages: WELCOME_MESSAGE,
      created_at: new Date()
    }
  });

  return conversation;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { conversationId, messages } = body;
    
    // Validate required fields
    if (!conversationId) {
      console.error('Missing conversationId');
      return new NextResponse("Missing conversationId", { status: 400 });
    }
    
    if (!Array.isArray(messages) || messages.length === 0) {
      console.error('Invalid messages array:', messages);
      return new NextResponse("Invalid messages array", { status: 400 });
    }

    // Validate each message in the array has the correct structure
    for (const message of messages) {
      if (!message.id || !message.user_content || !message.ai_content) {
        console.error('Missing id, user_content or ai_content:', message);
        return new NextResponse("Invalid message structure", { status: 400 });
      }

      // Validate user_content
      if (!message.user_content.role || !message.user_content.content || !message.user_content.timestamp) {
        console.error('Invalid user_content format:', message.user_content);
        return new NextResponse("Invalid user_content format", { status: 400 });
      }

      // Validate ai_content
      if (!message.ai_content.role || !message.ai_content.content || !message.ai_content.timestamp) {
        console.error('Invalid ai_content format:', message.ai_content);
        return new NextResponse("Invalid ai_content format", { status: 400 });
      }

      // Ensure AI content is not empty
      if (!message.ai_content.content.trim()) {
        console.error('Empty AI response content');
        return new NextResponse("AI response content cannot be empty", { status: 400 });
      }
    }

    // Get or create god_user for the authenticated user
    let godUser = await prisma.god_users.findFirst({
      where: { auth_user_id: session.user.id }
    });

    if (!godUser) {
      // Create a new god_user if one doesn't exist
      godUser = await prisma.god_users.create({
        data: {
          auth_user_id: session.user.id,
          email: session.user.email || '',
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }

    // Get conversation
    const conversation = await prisma.god_chat_conversations.findFirst({
      where: {
        id: conversationId,
        user_id: godUser.id
      }
    });

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    try {
      // Save message to database with proper typing
      const savedMessage = await prisma.god_chat_messages.create({
        data: {
          conversation_id: conversationId,
          messages: messages as any, // Cast to any since we know the schema accepts Json
          created_at: new Date()
        } as any // Cast the entire data object to any to match schema
      });

      // Update conversation timestamp
      await prisma.god_chat_conversations.update({
        where: { id: conversationId },
        data: { updated_at: new Date() }
      });

      console.log('Message saved successfully:', savedMessage.id);

      // Type assertion for the response
      const response = {
        id: savedMessage.id,
        messages: messages, // Use the original messages array instead of trying to access it from savedMessage
        created_at: savedMessage.created_at
      };

      return NextResponse.json(response);
    } catch (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error in POST /api/chat/messages:', error);
    return new NextResponse(error instanceof Error ? error.message : "Internal Error", { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { conversationId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const conversationId = params.conversationId;
    if (!conversationId) {
      return new NextResponse("Conversation ID required", { status: 400 });
    }

    // Get messages for the conversation
    const messages = await prisma.god_chat_messages.findMany({
      where: {
        conversation_id: conversationId
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error in GET /api/chat/messages:', error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error",
      { status: 500 }
    );
  }
} 