/**
 * Twilio Server Entry Point (server/index.ts)
 * 
 * This is the main server file for handling Twilio messaging services.
 * It manages port allocation, server startup, and graceful shutdown.
 * 
 * Related Files:
 * - server/ngrok.ts (Tunnel for Twilio webhooks)
 * - scripts/start-services.ts (Service orchestration)
 * - scripts/kill-ports.sh (Unix port management)
 * - scripts/kill-ports.bat (Windows port management)
 * - app/api/messaging/route.ts (Message handling)
 * - lib/twilio.ts (Twilio client configuration)
 * - .env.local (Port configuration)
 * 
 * Environment Variables Used:
 * - TWILIO_SERVER_PORT (default: 3002)
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - MESSAGING_SERVICE_SID
 * 
 * Key Features:
 * 1. Cross-platform port management
 * 2. Graceful shutdown handling
 * 3. Port conflict resolution
 * 4. Error handling
 * 5. Process cleanup
 */

import express from 'express';
import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
config();

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.TWILIO_SERVER_PORT || 3002;

/**
 * Port Management Functions
 * 
 * Used by:
 * - scripts/start-services.ts
 * - server/ngrok.ts
 * - scripts/kill-ports.sh
 * - scripts/kill-ports.bat
 */

// Check if port is in use
async function isPortInUse(port: number): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -i :${port}`);
    return !!stdout;
  } catch (error) {
    return false; // If lsof command fails, assume port is free
  }
}

/**
 * Cross-Platform Port Killer
 * 
 * Handles port cleanup on:
 * - Windows (using netstat and taskkill)
 * - Unix/Linux (using fuser)
 * - macOS (using lsof)
 */
async function killProcessOnPort(port: number): Promise<void> {
  try {
    if (process.platform === 'win32') {
      // Windows
      await execAsync(`netstat -ano | findstr :${port}`).then(async ({ stdout }) => {
        const pid = stdout.split(/\s+/)[4];
        if (pid) await execAsync(`taskkill /F /PID ${pid}`);
      });
    } else {
      // Unix-like
      await execAsync(`fuser -k ${port}/tcp`).catch(() => {
        // Ignore errors if no process found
      });
    }
  } catch (error) {
    console.warn(`Warning: Could not kill process on port ${port}:`, error);
  }
}

/**
 * Server Startup Handler
 * 
 * Flow:
 * 1. Check if port is in use
 * 2. Kill existing process if needed
 * 3. Wait for port to be freed
 * 4. Start Express server
 * 
 * Error Handling:
 * - Port conflicts
 * - Process termination failures
 * - Server startup errors
 */
const startServer = async () => {
  try {
    // Check if port is in use
    const portInUse = await isPortInUse(Number(PORT));
    if (portInUse) {
      console.log(`Port ${PORT} is in use. Attempting to free it...`);
      await killProcessOnPort(Number(PORT));
      // Wait a moment for the port to be freed
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`Twilio Messaging Service running at http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

/**
 * Cleanup Handler
 * 
 * Ensures graceful shutdown by:
 * 1. Closing server connections
 * 2. Killing port processes
 * 3. Cleaning up resources
 */
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down...');
  await killProcessOnPort(Number(PORT));
  process.exit(0);
});

startServer(); 