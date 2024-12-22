// app/api/accept-invitation/[token]/route.ts
// This is the route for accepting an invitation
// It is used to accept an invitation for a user
// Handles accepting an invitation

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const { password, responsibilities, username } = await req.json();
  const supabase = createRouteHandlerClient({ cookies });

  if (!token || !password) {
    return NextResponse.json(
      { error: "Token and password are required" },
      { status: 400 }
    );
  }

  try {
    // Fetch the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('god_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (invitationError || !invitation) {
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

    // First, check if user already exists
    const { data: existingUser } = await supabase
      .from('god_users')
      .select('auth_user_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Create the user in Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          first_name,
          last_name,
          full_name: `${first_name} ${last_name}`,
          username,
          role: 'USER',
        },
      },
    });

    if (signUpError) {
      console.error('Signup error in app/api/accept-invitation/[token]/route.ts:', signUpError);
      throw signUpError;
    }

    if (!authData.user) {
      throw new Error('No user data returned from signup');
    }

    // Create the user profile in god_users table
    const { error: profileError } = await supabase
      .from('god_users')
      .insert({
        id: uuidv4(),
        auth_user_id: authData.user.id,
        email: email,
        first_name: first_name,
        last_name: last_name,
        full_name: `${first_name} ${last_name}`,
        role: 'USER',
        username: username,
        bank_id: bank_id,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Rollback: delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from('god_invitations')
      .delete()
      .eq('token', token);

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError);
    }

    return NextResponse.json(
      { 
        message: "Invitation accepted and user created",
        user: {
          id: authData.user.id,
          email: authData.user.email,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error confirming invitation:", error);
    return NextResponse.json(
      { 
        error: "Failed to accept invitation.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Find the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.redirect(
        `${request.url}/auth/error?error=Invalid or expired invitation`
      );
    }

    // Check if user already exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', invitation.email)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    if (existingUser) {
      // Update existing user with invitation data
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: invitation.first_name,
          last_name: invitation.last_name,
          phone: invitation.phone,
          bank_id: invitation.bank_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id);

      if (updateError) throw updateError;
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from('invitations')
      .delete()
      .eq('token', token);

    if (deleteError) throw deleteError;

    // Redirect to signup/login
    return NextResponse.redirect(
      `${request.url}/auth/signup?email=${invitation.email}&token=${token}`
    );
  } catch (error) {
    console.error('Error processing invitation:', error);
    return NextResponse.redirect(
      `${request.url}/auth/error?error=Error processing invitation`
    );
  }
}