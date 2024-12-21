import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { preferred_bible_version, message_length_preference, theme_preferences } = body;

    const updatedPreferences = await prisma.god_user_preferences.update({
      where: { user_id: user.id },
      data: {
        preferred_bible_version,
        message_length_preference,
        theme_preferences,
      },
    });

    return NextResponse.json(updatedPreferences);
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
} 