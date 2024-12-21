// app/api/user/preferences/route.ts
// This is the route for getting and updating user preferences
// It is used to get and update user preferences
// Handles getting and updating user preferences

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await prisma.god_user_preferences.findUnique({
      where: { user_id: user.id },
      include: {
        user: {
          select: {
            email: true,
            first_name: true,
            last_name: true,
            phone_number: true
          }
        }
      }
    });

    if (!preferences) {
      return NextResponse.json({ error: "Preferences not found" }, { status: 404 });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Error fetching preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      theme_preferences,
      blocked_themes,
      preferred_bible_version,
      message_length_preference
    } = body;

    const preferences = await prisma.god_user_preferences.upsert({
      where: { user_id: user.id },
      update: {
        theme_preferences,
        blocked_themes,
        preferred_bible_version,
        message_length_preference,
        updated_at: new Date()
      },
      create: {
        user_id: user.id,
        theme_preferences,
        blocked_themes,
        preferred_bible_version,
        message_length_preference
      }
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Error updating preferences" },
      { status: 500 }
    );
  }
}
