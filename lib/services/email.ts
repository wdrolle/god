import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendConfirmationEmail(email: string, token: string) {
  const confirmationLink = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm-email/${token}`;

  const { data, error } = await resend.emails.send({
    from: 'Scripture Messages <info@email.2920.ai>',
    to: email,
    subject: 'Confirm your email address',
    html: `
      <h2>Welcome to Scripture Messages</h2>
      <p>Please confirm your email address by clicking the link below:</p>
      <a href="${confirmationLink}">Confirm Email</a>
      <p>This link will expire in 24 hours.</p>
    `
  });

  if (error) {
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }

  return data;
} 