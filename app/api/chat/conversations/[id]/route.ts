// api/chat/conversations/[id]/route.ts
// This is the route for updating a conversation
// It is used to update the title of a conversation
// Handles updating a conversation

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  console.log('DEBUG: Starting conversation update request');
  console.log('DEBUG: Conversation ID:', params.id);
  
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);
    console.log('DEBUG: Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      console.log('DEBUG: No session found');
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    let body;
    try {
      const text = await req.text(); // Get raw body text first
      console.log('DEBUG: Raw request body:', text);
      
      try {
        body = JSON.parse(text);
        console.log('DEBUG: Parsed request body:', body);
      } catch (parseError) {
        console.error('DEBUG: JSON parse error:', parseError);
        return new NextResponse(
          JSON.stringify({ error: "Invalid JSON in request body" }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    } catch (bodyError) {
      console.error('DEBUG: Body read error:', bodyError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to read request body" }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const { title } = body;

    if (!title || typeof title !== 'string') {
      console.log('DEBUG: Invalid title:', title);
      return new NextResponse(
        JSON.stringify({ error: "Invalid title" }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    try {
      // Get the god_user
      const godUser = await prisma.god_users.findFirst({
        where: { 
          auth_user_id: session.user.id 
        }
      });
      console.log('DEBUG: Found god_user:', JSON.stringify(godUser, null, 2));

      if (!godUser) {
        console.log('DEBUG: No god_user found');
        return new NextResponse(
          JSON.stringify({ error: "User not found" }),
          { 
            status: 404,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Update conversation
      const updatedConversation = await prisma.god_chat_conversations.update({
        where: {
          id: params.id
        },
        data: { 
          title: title.trim(),
          updated_at: new Date()
        },
        include: {
          god_chat_messages: {
            orderBy: {
              created_at: 'asc'
            }
          }
        }
      });
      console.log('DEBUG: Updated conversation:', JSON.stringify(updatedConversation, null, 2));

      return new NextResponse(
        JSON.stringify(updatedConversation),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (dbError: any) {
      console.error('DEBUG: Database error:', dbError);
      return new NextResponse(
        JSON.stringify({ 
          error: "Database operation failed",
          details: dbError.message 
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error: any) {
    console.error('DEBUG: Error in route handler:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to update conversation",
        details: error.message 
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  console.log('DEBUG: Starting conversation delete request');
  console.log('DEBUG: Conversation ID:', params.id);
  
  try {
    const session = await getServerSession(authOptions);
    console.log('DEBUG: Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      console.log('DEBUG: No session found');
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      // Get the god_user
      const godUser = await prisma.god_users.findFirst({
        where: { 
          auth_user_id: session.user.id 
        }
      });
      
      if (!godUser) {
        console.log('DEBUG: No god_user found');
        return new NextResponse(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify conversation exists and belongs to the user
      const existingConversation = await prisma.god_chat_conversations.findFirst({
        where: {
          AND: [
            { id: params.id },
            { user_id: godUser.id }
          ]
        }
      });

      if (!existingConversation) {
        console.log('DEBUG: Conversation not found or unauthorized');
        return new NextResponse(
          JSON.stringify({ error: "Conversation not found" }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Delete messages first (if not using cascade delete)
      await prisma.god_chat_messages.deleteMany({
        where: {
          conversation_id: params.id
        }
      });

      // Delete the conversation
      await prisma.god_chat_conversations.delete({
        where: {
          id: params.id
        }
      });

      return new NextResponse(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (dbError: any) {
      console.error('DEBUG: Database error:', dbError);
      return new NextResponse(
        JSON.stringify({ 
          error: "Database operation failed",
          details: dbError.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('DEBUG: Error in route handler:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to delete conversation",
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}