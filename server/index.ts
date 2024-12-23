const express = require('express')
const { Twilio } = require('twilio')
const { dotenv } = require('./config')
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express'

const app = express()
const port = process.env.TWILIO_SERVER_PORT || 3002

// Initialize Twilio client
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// Middleware to parse JSON bodies
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Define types for Express
interface TwilioRequest extends ExpressRequest {
  body: {
    Body: string
    From: string
  }
}

// Test route
app.get('/', (req: ExpressRequest, res: ExpressResponse) => {
  res.send('Twilio Messaging Service is running!')
})

// Webhook endpoint for Twilio
app.post('/webhook/sms', async (req: TwilioRequest, res: ExpressResponse) => {
  try {
    const { Body, From } = req.body

    // Log incoming message
    console.log(`Received message from ${From}: ${Body}`)

    // Send response message
    await twilioClient.messages.create({
      body: 'Thank you for your message! We will get back to you soon.',
      to: From,
      messagingServiceSid: process.env.MESSAGING_SERVICE_SID,
    })

    res.status(200).send('Message processed')
  } catch (error) {
    console.error('Error processing message:', error)
    res.status(500).send('Error processing message')
  }
})

// Start server
app.listen(port, () => {
  console.log(`Twilio Messaging Service running at http://localhost:${port}`)
}) 