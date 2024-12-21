// app/api/accept-confirmation-email/[token]/route.ts
// This is the route for accepting a confirmation email
// It is used to accept a confirmation email for a user
// Handles accepting a confirmation email

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    // Find the token in god_one_time_tokens
    const token = await prisma.god_one_time_tokens.findFirst({
      where: {
        token: params.token,
        type: 'confirmation_token',
        used_at: null,
        expires_at: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });

    if (!token) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Update the user's email_confirmed_at in auth.users
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      token.user_id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        { error: "Failed to confirm email" },
        { status: 500 }
      );
    }

    // Mark token as used
    await prisma.god_one_time_tokens.update({
      where: {
        id: token.id
      },
      data: {
        used_at: new Date()
      }
    });

    // Update god_users verified status
    await prisma.god_users.update({
      where: {
        id: token.user_id
      },
      data: {
        verified: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error confirming email:", error);
    return NextResponse.json(
      { error: "Failed to confirm email" },
      { status: 500 }
    );
  }
}
