// app/api/confirm-email/route.ts

'use server';

import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { user_id, token } = await req.json();

  try {
    // Retrieve the confirmation token from one_time_tokens
    const oneTimeToken = await prisma.one_time_tokens.findUnique({
      where: { id: user_id },
    });

    if (!oneTimeToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Update the user's email_confirmed_at and confirmed_at fields in auth_users
    const updatedUser = await prisma.auth_users.update({
      where: { id: oneTimeToken.user_id },
      data: {
        email_confirmed_at: new Date(),
        confirmed_at: new Date(),  // Update confirmed_at with the least of email_confirmed_at and phone_confirmed_at
        confirmation_token: null,
        updated_at: new Date(),
      },
    });

    // Delete the confirmation token from one_time_tokens after use
    await prisma.one_time_tokens.delete({ where: { id: oneTimeToken.id } });

    return NextResponse.json({ message: "Email confirmed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error confirming email:", error);
    if (error instanceof PrismaClientKnownRequestError) {
      // Handle Prisma-specific errors
      return NextResponse.json(
        { error: "Database error occurred." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
