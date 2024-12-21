// app/api/accept-confirmation-email/[token]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  console.log("Received token:", token);

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    // Fetch the token data from the database using the token_hash
    const tokenData = await prisma.one_time_tokens.findUnique({
      where: { token_hash: token }, // Ensure token_hash is unique
      select: { id: true, user_id: true, token_hash: true, relates_to: true },
    });

    if (!tokenData) {
      console.error(
        "Invalid or expired token in POST for accept-confirmation-email"
      );
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    console.log("Token data:", tokenData);
    // Confirm the user's email by updating the 'email_confirmed_at' field
    const updatedUser = await prisma.auth_users.update({
      where: { id: tokenData.user_id },
      data: {
        email_confirmed_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log("Updated user on public user table:", updatedUser);

    // Confirm the user's email by updating the 'emailConfirmedAt' field
    const updatedAuthUser = await prisma.auth_users.update({
      where: { id: tokenData.user_id },
      data: {
        email_confirmed_at: new Date()
      },
    });

    console.log("Updated user on auth table:", updatedAuthUser);

    // Delete the used token
    await prisma.one_time_tokens.delete({
      where: { token_hash: token },
    });

    return NextResponse.json(
      { message: "Email confirmed successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error confirming email:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred while confirming the email.",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
