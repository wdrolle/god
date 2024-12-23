import { spawn, ChildProcess } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

const processes: ChildProcess[] = []

function startService(command: string, args: string[], name: string): ChildProcess {
  try {
    const childProcess = spawn(command, args, { 
      stdio: 'inherit',
      shell: process.platform === 'win32' // Use shell on Windows
    })
    
    childProcess.on('error', (error: Error) => {
      console.error(`Error starting ${name}:`, error.message)
    })

    childProcess.on('exit', (code: number | null) => {
      if (code !== 0) {
        console.log(`${name} process exited with code ${code}`)
      }
    })

    processes.push(childProcess)
    return childProcess
  } catch (error) {
    console.error(`Failed to start ${name}:`, error)
    throw error
  }
}

function cleanup() {
  console.log('\nGracefully shutting down services...')
  processes.forEach(proc => {
    try {
      proc.kill()
    } catch (error) {
      console.error('Error killing process:', error)
    }
  })
  process.exit(0)
}

function startAllServices() {
  try {
    // Start all services
    console.log('Starting all services...')

    // Start Next.js
    const nextProcess = startService('npm', ['run', 'dev'], 'Next.js')

    // Start Twilio Server after a short delay
    setTimeout(() => {
      const twilioProcess = startService('npm', ['run', 'server'], 'Twilio Server')

      // Start ngrok tunnel after Twilio server is running
      setTimeout(() => {
        const ngrokProcess = startService('npm', ['run', 'tunnel'], 'ngrok')
      }, 2000)
    }, 1000)

    console.log('\nAll services started! Press Ctrl+C to stop all services.')

    // Handle process termination
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error)
      cleanup()
    })

  } catch (error) {
    console.error('Error starting services:', error instanceof Error ? error.message : error)
    cleanup()
  }
}

// Start everything
startAllServices() 