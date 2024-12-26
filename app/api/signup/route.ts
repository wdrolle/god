// File: /app/api/signup/route.ts
// This is the route for signing up a user
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, confirm_password, first_name, last_name, phone } = body;

    // Validate required fields
    if (!email || !password || !confirm_password || !first_name || !last_name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Validate password match
    if (password !== confirm_password) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const user_id = uuidv4();
    const confirmationToken = uuidv4();
    const hashedPassword = await hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // Create auth user
      const authUser = await tx.users.create({
        data: {
          id: user_id,
          instance_id: uuidv4(),
          aud: 'authenticated',
          role: 'authenticated',
          email: email.toLowerCase(),
          encrypted_password: hashedPassword,
          email_confirmed_at: new Date(),
          confirmed_at: new Date(),
          last_sign_in_at: null,
          raw_app_meta_data: {
            provider: 'email',
            providers: ['email']
          },
          raw_user_meta_data: {
            first_name,
            last_name,
            phone
          },
          created_at: new Date(),
          updated_at: new Date(),
          phone: phone,
          phone_confirmed_at: null,
          confirmation_token: null,
          confirmation_sent_at: null,
          recovery_token: null
        }
      });

      // Create god user
      const godUser = await tx.god_users.create({
        data: {
          auth_user_id: authUser.id,
          email: email.toLowerCase(),
          first_name,
          last_name,
          phone,
          role: 'USER',
          subscription_status: 'TRIAL',
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      return { authUser, godUser };
    });

    // Send welcome email
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-confirmation-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.toLowerCase(),
        first_name,
        last_name
      })
    });

    if (!emailResponse.ok) {
      console.error('Failed to send welcome email:', await emailResponse.text());
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully! Please check your email for login information.",
      userId: result.authUser.id,
      redirectTo: "/login"
    });

  } catch (error) {
    console.error('Signup error:', error);
    let errorMessage = "Failed to create account";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
