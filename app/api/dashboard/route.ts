// app/api/dashboard/route.ts
// This is the route for the dashboard
// It is used to get the dashboard data for a user
// Handles getting the dashboard data

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { 
        id: session.user.id 
      },
      include: {
        god_users: true
      }
    });

    if (!user || !user.god_users[0]) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const godUser = user.god_users[0];

    return NextResponse.json({
      id: godUser.id,
      email: user.email,
      first_name: godUser.first_name,
      last_name: godUser.last_name,
      phone_number: user.phone,
      subscription: {
        status: godUser.subscription_status,
        preferred_time: null,
        next_message_at: null
      },
      preferences: {
        theme_preferences: ['faith'],
        preferred_bible_version: 'NIV',
        message_length_preference: 'MEDIUM'
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 