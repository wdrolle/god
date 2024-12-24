// server/ngrok.ts
// This file is used to start the ngrok tunnel
// It is used to start the ngrok tunnel for the app

/**
 * Ngrok Tunnel Service (server/ngrok.ts)
 * 
 * This file manages the ngrok tunnel setup for exposing local endpoints
 * to Twilio webhooks. It creates a secure tunnel for webhook communication.
 * 
 * Related Files:
 * - server/index.ts (Main server using the tunnel)
 * - scripts/start-services.ts (Orchestrates tunnel startup)
 * - app/api/messaging/webhook/route.ts (Receives webhook calls)
 * - app/api/twilio/route.ts (Twilio API integration)
 * - .env.local (Ngrok configuration)
 * - package.json (Tunnel start script)
 * - scripts/kill-ports.sh (Port management)
 * 
 * Environment Variables Used:
 * - NGROK_PORT (default: 3002)
 * - NGROK_AUTHTOKEN (required)
 * - TWILIO_WEBHOOK_PATH (/webhook/sms)
 * 
 * Used By:
 * - Twilio webhook configuration
 * - SMS message handling
 * - External service integration
 * - Development testing
 */

import ngrok from 'ngrok';
import { config } from 'dotenv';
config();

// Port configuration for tunnel
const NGROK_PORT = process.env.NGROK_PORT || 3002;

/**
 * Ngrok Tunnel Starter
 * 
 * Creates and manages the ngrok tunnel for webhook communication.
 * 
 * Features:
 * 1. Secure HTTPS tunnel
 * 2. Custom domain support
 * 3. Authentication handling
 * 4. Port forwarding
 * 5. Error management
 * 
 * Returns:
 * - url: string (The public tunnel URL)
 * 
 * Errors:
 * - Authentication failures
 * - Port conflicts
 * - Connection issues
 */
export async function startNgrok() {
  try {
    // Initialize tunnel with configuration
    const url = await ngrok.connect({
      addr: NGROK_PORT,
      authtoken: process.env.NGROK_AUTHTOKEN
    });

    // Log connection status and URLs
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

/**
 * Direct Execution Handler
 * 
 * Allows file to be run directly for testing or standalone use.
 * Used by:
 * - npm run tunnel
 * - Development testing
 * - Manual tunnel management
 */
if (require.main === module) {
  startNgrok();
}

/**
 * Usage Notes:
 * 
 * 1. Development:
 *    - Run directly: npm run tunnel
 *    - Part of start-all: npm run start-all
 * 
 * 2. Configuration:
 *    - Set NGROK_AUTHTOKEN in .env.local
 *    - Configure port in environment
 *    - Set webhook paths in Twilio
 * 
 * 3. Integration:
 *    - Update Twilio webhook URLs
 *    - Configure security settings
 *    - Monitor tunnel status
 */ 