import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendVerificationSMS(phone: string, factorId: string) {
  try {
    const message = await client.messages.create({
      body: `Your Scripture Messages verification code is: ${Math.floor(100000 + Math.random() * 900000)}`,
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    return message;
  } catch (error) {
    throw new Error(`Failed to send verification SMS: ${error}`);
  }
} 