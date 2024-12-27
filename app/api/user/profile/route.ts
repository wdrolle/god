/**
 * User Profile API Route
 * 
 * Purpose:
 * - Handles user profile and preferences updates
 * - Supports partial updates (only changed fields)
 * - Returns combined profile and preferences data
 * 
 * Endpoints:
 * GET  /api/user/profile - Fetch user profile with preferences
 * POST /api/user/profile - Update profile and/or preferences
 * 
 * Used By:
 * - Dashboard preferences panel
 * - User settings page
 * - Profile management interfaces
 * 
 * Example POST body:
 * {
 *   "first_name": "John",          // Optional - update if provided
 *   "theme_preferences": ["Love"],  // Optional - update if provided
 *   "preferred_bible_version": "NIV" // Optional - update if provided
 * }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Define types for the request body
interface PreferencesUpdateBody {
  theme_preferences?: string[];
  blocked_themes?: string[];
  preferred_bible_version?: string;
  message_length_preference?: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get or create user with preferences
    let user = await prisma.god_users.findFirst({
      where: { 
        OR: [
          { email: session.user.email },
          { auth_user_id: session.user.id }
        ]
      },
      include: {
        god_user_preferences: true
      }
    });

    // Create user if not found
    if (!user) {
      user = await prisma.god_users.create({
        data: {
          auth_user_id: session.user.id,
          email: session.user.email,
          created_at: new Date(),
          updated_at: new Date(),
          god_user_preferences: {
            create: {
              theme_preferences: [],
              blocked_themes: [],
              preferred_bible_version: 'KJV',
              message_length_preference: 'MEDIUM'
            }
          }
        },
        include: {
          god_user_preferences: true
        }
      });
    }

    // Format response
    return NextResponse.json({
      ...user,
      preferences: user.god_user_preferences
    });

  } catch (error) {
    console.error("[USER_PROFILE_GET]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error",
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user
    const user = await prisma.god_users.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const body: PreferencesUpdateBody = await request.json();
    const {
      theme_preferences,
      blocked_themes,
      preferred_bible_version,
      message_length_preference
    } = body;

    // Normalize theme arrays to lowercase for consistency
    const normalizedThemes = theme_preferences?.map((theme: string) => theme.toLowerCase()) || [];
    const normalizedBlockedThemes = blocked_themes?.map((theme: string) => theme.toLowerCase()) || [];

    // Update or create preferences using upsert
    const updatedPreferences = await prisma.god_user_preferences.upsert({
      where: {
        user_id: user.id
      },
      create: {
        user_id: user.id,
        theme_preferences: normalizedThemes,
        blocked_themes: normalizedBlockedThemes,
        preferred_bible_version: preferred_bible_version || 'KJV',
        message_length_preference: message_length_preference || 'MEDIUM'
      },
      update: {
        theme_preferences: normalizedThemes,
        blocked_themes: normalizedBlockedThemes,
        preferred_bible_version: preferred_bible_version || 'KJV',
        message_length_preference: message_length_preference || 'MEDIUM'
      }
    });

    // Get updated user with preferences
    const updatedUser = await prisma.god_users.findUnique({
      where: { id: user.id },
      include: {
        god_user_preferences: true
      }
    });

    return NextResponse.json({
      ...updatedUser,
      preferences: updatedUser?.god_user_preferences
    });

  } catch (error) {
    console.error("[USER_PROFILE_POST]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error",
      { status: 500 }
    );
  }
} 