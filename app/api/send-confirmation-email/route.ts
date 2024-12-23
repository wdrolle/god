// app/api/send-confirmation-email/route.ts
// This is the route for sending a confirmation email
// It is used to send a confirmation email to a user
// Handles sending a confirmation email

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, confirmationLink } = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'Inherent Risk AI <noreply@email.2920.ai>',
      to: email,
      subject: 'Confirm Your Signup for Inherent Risk AI',
      html: `
      <!doctype html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width" />
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <title>Confirm Your Signup</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap');
              body {
                background-color: #f6f6f6;
                font-family: 'Poppins', sans-serif;
                font-size: 14px;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
              }
              .container {
                max-width: 580px;
                margin: 0 auto;
                padding: 10px;
              }
              .content {
                background: linear-gradient(90deg, #cbcaa5, #acb6e5);
                padding: 20px;
                border-radius: 6px;
                text-align: center;
              }
              h1, h2 {
                color: #000;
                margin: 0 0 10px;
              }
              p {
                font-size: 14px;
                color: #333;
                margin: 10px 0;
              }
              a {
                display: block;
                background-color: #3498db;
                color: #fff;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
              }
              .icon-container {
                display: flex;
                justify-content: center;
                margin: 20px 0;
              }
              .icon {
                margin: 0 10px;
              }
              .icon img {
                width: 50px;
                height: 50px;
              }
              .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #999;
              }
            </style>
          </head>
          <body>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
              <tr>
                <td>&nbsp;</td>
                <td class="container">
                  <div class="content">
                    <h1>Confirm your email</h1>
                    <h2>You are just one step away</h2>
                    <p>Thank you for signing up for Inherent Risk AI. Please confirm your email by clicking the button below:</p>

                    <!-- Button on its own row -->
                    <a href="${confirmationLink}" target="_blank">Confirm Email</a>

                    <!-- Excerpt from FFIEC BSA/AML Manual -->
                    <p>At Inherent Risk AI, we take your financial security seriously. Our platform is built with the latest standards ensuring a risk-focused approach to bank safety.</p>

                    <p>For more information about risk assessments and banking regulations, please refer to www.2920Wall.llc. This website follows important guidelines related to Bank Secrecy Act (BSA) and Anti-Money Laundering (AML) and OFAC operating models.</p>
                    
                    <!-- Adding Banking Icons with text descriptions -->
                    <div class="icon-container" style="text-align: center;">
                      <!-- Icon 1: Risk Assessment -->
                      <div class="icon" style="display: inline-block; margin: 10px;">
                        <img src="https://nsualatbqafjjehqgqya.supabase.co/storage/v1/object/public/icons/icons/icons8-book-outline-gradient-96.png" alt="Risk Assessment" style="display: block; margin: 0 auto; width: 50px; height: 50px;">
                        <p style="font-size: 14px; margin-top: 5px;">Risk Assessment</p>
                      </div>

                      <!-- Icon 2: Banking -->
                      <div class="icon" style="display: inline-block; margin: 10px;">
                        <img src="https://nsualatbqafjjehqgqya.supabase.co/storage/v1/object/public/icons/icons/icons8-merchant-account-96.png" alt="Banking" style="display: block; margin: 0 auto; width: 50px; height: 50px;">
                        <p style="font-size: 14px; margin-top: 5px;">Banking</p>
                      </div>

                      <!-- Icon 3: Security -->
                      <div class="icon" style="display: inline-block; margin: 10px;">
                        <img src="https://nsualatbqafjjehqgqya.supabase.co/storage/v1/object/public/icons/icons/icons8-password-gradient-96.png" alt="Security" style="display: block; margin: 0 auto; width: 50px; height: 50px;">
                        <p style="font-size: 14px; margin-top: 5px;">Security</p>
                      </div>
                    </div>

                    <!-- Footer -->
                    <div class="footer">
                      <p>Powered by <a href="https://2920wall.llc/">2920 Wall, LLC</a>.</p>
                    </div>
                  </div>
                </td>
                <td>&nbsp;</td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });
    

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Confirmation email sent successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error sending confirmation email' }, { status: 500 });
  }
}