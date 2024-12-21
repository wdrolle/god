// app/api/accept-invitation/[token]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const { password, responsibilities, username } = await req.json();

  if (!token || !password) {
    return NextResponse.json(
      { error: "Token and password are required" },
      { status: 400 }
    );
  }

  try {
    // Fetch the invitation using the token
    const invitation = await prisma.invitations.findFirst({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const { email, first_name, last_name, bank_id } = invitation;

    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        { error: "Invitation is missing necessary information" },
        { status: 400 }
      );
    }

    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create the user in the auth_users table
    const newUser = await prisma.auth_users.create({
      data: {
        id: uuidv4(),
        email: email,
        encrypted_password: hashedPassword,
        email_confirmed_at: new Date(),
        confirmation_token: null,
      },
    });

    // Create the user in the public_users table
    await prisma.public_users.create({
      data: {
        id: uuidv4(),
        email: email,
        first_name: first_name,
        last_name: last_name,
        full_name: `${first_name} ${last_name}`,
        bank_id: bank_id ?? undefined,
        role: 'DEFAULT',
        admin_group_id: 2,
        username: username,
      },
    });

    // Delete the invitation after it's been used
    await prisma.invitations.deleteMany({
      where: { token },
    });

    return NextResponse.json(
      { message: "Invitation accepted and user created" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error confirming invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation." },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  try {
    // Fetch the invitation details using the token
    const invitation = await prisma.invitations.findFirst({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const { id, first_name, last_name, email, bank_id } = invitation;

    // Return the invitation details
    return NextResponse.json({
      id: id.toString(),
      email: email,
      bank_id: bank_id ?? '',
      bankName: '', // Adjust based on your schema
      first_name: first_name,
      last_name: last_name,
      phone: '', // Adjust based on your schema
      responsibilities: '', // Adjust based on your schema
    });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation details." },
      { status: 500 }
    );
  }
}