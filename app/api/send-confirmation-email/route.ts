// app/api/send-confirmation-email/route.ts
// This is the route for sending a confirmation email
// It is used to send a confirmation email to a user
// Handles sending a confirmation email

// app/api/send-confirmation-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, first_name, last_name } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const { data, error } = await resend.emails.send({
      from: 'Scripture Messages <info@email.2920.ai>',
      to: email,
      subject: 'Welcome to Scripture Messages',
      html: `
        <!doctype html>
        <html>
          <head>
            <title>Welcome to Scripture Messages</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #2563eb; text-align: center;">Welcome to Scripture Messages!</h1>
              
              <p>Dear ${first_name} ${last_name},</p>
              
              <p>Thank you for joining Scripture Messages! We're excited to have you as part of our community.</p>
              
              <p>You can now log in to your account using:</p>
              <ul>
                <li>Email: ${email}</li>
                <li>Password: (the password you created during signup)</li>
              </ul>

              <p>To get started:</p>
              <ol>
                <li>Visit our login page</li>
                <li>Enter your email and password</li>
                <li>Start exploring our daily scripture messages</li>
              </ol>

              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                  Log In to Your Account
                </a>
              </div>

              <p style="margin-top: 30px;">
                Best regards,<br>
                The Scripture Messages Team
              </p>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send welcome email error:', error);
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}