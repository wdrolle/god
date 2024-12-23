import express from 'express';
import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
config();

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.TWILIO_SERVER_PORT || 3002;

// Check if port is in use
async function isPortInUse(port: number): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -i :${port}`);
    return !!stdout;
  } catch (error) {
    return false; // If lsof command fails, assume port is free
  }
}

// Kill process on port (cross-platform)
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

// Start server with proper port handling
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

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down...');
  await killProcessOnPort(Number(PORT));
  process.exit(0);
});

startServer(); 