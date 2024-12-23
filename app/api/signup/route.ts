// File: /app/api/signup/route.ts
// This is the route for signing up a user
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma' // Ensure this path is correct
import { hash } from "bcryptjs";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { email, password, first_name, last_name, phone, country_code } = body as {
      email: string
      password: string
      first_name: string
      last_name: string
      phone: string
      country_code: string
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create confirmation token
    const confirmationToken = crypto.randomUUID();

    // Create user in database
    const user = await prisma.users.create({
      data: {
        email,
        encrypted_password: hashedPassword,
        phone,
        confirmation_token: confirmationToken,
        god_users: {
          create: {
            email,
            first_name,
            last_name,
            phone,
            role: 'USER',
            subscription_status: 'TRIAL',
          }
        }
      },
      include: {
        god_users: true,
      },
    });

    // Send confirmation email
    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/confirm-email?token=${confirmationToken}`;
    
    await resend.emails.send({
      from: 'info@email.2920.ai',
      to: email,
      subject: 'Confirm your email',
      html: `
        <h1>Welcome to Daily Bible Verses!</h1>
        <p>Hi ${first_name},</p>
        <p>Please confirm your email by clicking the link below:</p>
        <a href="${confirmUrl}">Confirm Email</a>
        <p>If you didn't create this account, you can ignore this email.</p>
      `
    });

    return NextResponse.json({
      success: true,
      message: "Please check your email to confirm your account"
    });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
