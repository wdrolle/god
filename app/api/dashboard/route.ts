// app/api/dashboard/route.ts
// This is the route for the dashboard
// It is used to get the dashboard data for a user
// Handles getting the dashboard data

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user data with related records
    const userData = await prisma.god_users.findUnique({
      where: { id: user.id },
      include: {
        preferences: {
          select: {
            theme_preferences: true,
            preferred_bible_version: true,
            message_length_preference: true,
          }
        },
        subscriptions: {
          select: {
            status: true,
            preferred_time: true,
            next_message_at: true,
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 1
        }
      }
    });

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Format the response
    return NextResponse.json({
      id: userData.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone_number: userData.phone_number,
      subscription: userData.subscriptions[0],
      preferences: userData.preferences
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 