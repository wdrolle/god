// app/api/admin/users/route.ts
// This is the route for getting all users
// It is used to get all users for the admin page
// Handles getting all users

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

    // Check if user is admin
    const dbUser = await prisma.god_users.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (dbUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const users = await prisma.god_users.findMany({
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        verified: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 