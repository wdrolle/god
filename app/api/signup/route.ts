// File: /app/api/signup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

interface SignupError {
  message: string;
  code?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received signup data:", body);

    const { id, email, first_name, last_name, phone, country_code = "US" } = body;

    // Validate the data
    if (!id || !email || !first_name || !last_name || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create user in your database
    const user = await prisma.god_users.create({
      data: {
        id,
        email,
        first_name,
        last_name,
        phone_number: phone,
        role: "USER",
        verified: false,
        timezone: "UTC",
        preferred_language: "en",
        notification_preferences: { sms: true, email: true, phone_verified: false },
        preferences: {
          create: {
            theme_preferences: ["faith"],
            blocked_themes: [],
            preferred_bible_version: "NIV",
            message_length_preference: "MEDIUM",
          }
        },
        subscriptions: {
          create: {
            status: "TRIAL",
            theme_ids: ["faith"],
            preferred_time: new Date('1970-01-01T09:00:00-05:00'),
            frequency: "DAILY",
          }
        }
      },
      include: {
        preferences: true,
        subscriptions: true
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Error creating user" },
      { status: 500 }
    );
  }
}
