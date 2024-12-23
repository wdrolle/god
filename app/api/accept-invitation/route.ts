// app/api/accept-invitation/route.ts
// This is the route for accepting an invitation
// It is used to accept an invitation for a user
// Handles accepting an invitation

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: "Token is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch the invitation using the token
    const invitation = await prisma.god_users.findUnique({
      where: { id: token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: invitation.id,
      email: invitation.email,
      first_name: invitation.first_name,
      last_name: invitation.last_name,
      phone: invitation.phone,
    });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    // Accept invitation logic here
    const updatedUser = await prisma.users.update({
      where: { id: user.id },
      data: {
        email_confirmed_at: new Date(),
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Error accepting invitation" },
      { status: 500 }
    );
  }
}