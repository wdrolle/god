// app/api/dashboard/route.ts
// This is the route for the dashboard
// It is used to get the dashboard data for a user
// Handles getting the dashboard data

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

export async function GET() {
  const session = await getServerSession();
  
  if (!session?.user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    // TODO: Replace with actual database query
    const userData = {
      id: session.user.id,
      email: session.user.email,
      first_name: "John",
      last_name: "Doe",
      phone_number: "+1234567890",
      phone_country: "US",
      subscription: {
        status: "active",
        preferred_time: "09:00",
        next_message_at: new Date().toISOString(),
      },
      preferences: {
        theme_preferences: ["faith"],
        preferred_bible_version: "NIV",
        message_length_preference: "MEDIUM",
      },
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
} 