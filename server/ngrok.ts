const ngrok = require('ngrok')
import Config from './config'

async function startNgrok() {
  try {
    // Check if auth token exists
    const authToken = process.env.NGROK_AUTHTOKEN
    if (!authToken) {
      throw new Error('NGROK_AUTHTOKEN is not set in environment variables')
    }

    // Set auth token
    await ngrok.authtoken(authToken)
    
    // Get port number
    const port = process.env.TWILIO_SERVER_PORT || 3002

    // Connect to ngrok
    const url = await ngrok.connect({
      addr: port,
      region: 'us',
      onStatusChange: (status: string) => {
        console.log('Ngrok Status:', status)
      },
      onLogEvent: (log: string) => {
        if (log.includes('error')) console.error('Ngrok Log:', log)
      }
    })

    console.log('\nNgrok tunnel established!')
    console.log('Tunnel URL:', url)
    console.log('Twilio Webhook URL:', `${url}/webhook/sms`)

  } catch (error) {
    console.error('\nError starting ngrok:', error instanceof Error ? error.message : 'Unknown error')
    if (error instanceof Error && error.message.includes('NGROK_AUTHTOKEN')) {
      console.log('\nPlease ensure your NGROK_AUTHTOKEN is set correctly in .env')
      console.log('Current token:', process.env.NGROK_AUTHTOKEN)
      console.log('Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken')
    }
    process.exit(1)
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  try {
    console.log('\nClosing ngrok tunnel...')
    await ngrok.kill()
    console.log('Ngrok tunnel closed')
  } catch (error) {
    console.error('Error closing ngrok:', error)
  }
  process.exit(0)
})

startNgrok() 