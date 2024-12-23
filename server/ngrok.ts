import ngrok from 'ngrok';
import { config } from 'dotenv';
config();

const NGROK_PORT = process.env.NGROK_PORT || 3002;

export async function startNgrok() {
  try {
    const url = await ngrok.connect({
      addr: NGROK_PORT,
      authtoken: process.env.NGROK_AUTHTOKEN
    });

    console.log('Ngrok Status: connected');
    console.log('\nNgrok tunnel established!');
    console.log('Tunnel URL:', url);
    console.log('Twilio Webhook URL:', `${url}/webhook/sms`);

    return url;
  } catch (error) {
    console.error('Ngrok error:', error);
    process.exit(1);
  }
}

// Start if running directly
if (require.main === module) {
  startNgrok();
} 