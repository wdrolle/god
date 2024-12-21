// components/SubscriptionForm.tsx
// This file is used to handle the subscription form
// It is used to display the subscription form in the home page

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SubscriptionForm() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First get the IP address
      let ip = ''
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipResponse.json()
        ip = ipData.ip
      } catch (ipError) {
        console.error('Failed to get IP:', ipError)
        ip = 'unknown'
      }

      const { error } = await supabase
        .from('subscribers')
        .insert([{ 
          phone_number: phoneNumber,
          consent_date: new Date().toISOString(),
          consent_ip: ip,
          opt_in_method: 'web_form',
          consent_message: 'I agree to receive daily spiritual messages and Bible verses. Message and data rates may apply. Reply STOP to unsubscribe.'
        }])

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message)
      }

      alert('Successfully subscribed to daily messages!')
      setPhoneNumber('')
      setConsent(false)
    } catch (error) {
      console.error('Subscription error:', error instanceof Error ? error.message : 'Unknown error')
      alert('Failed to subscribe: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8">
      <div className="mb-4">
        <label htmlFor="phoneNumber" className="block mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="+1234567890"
          required
        />
      </div>
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
            className="mr-2"
          />
          <span className="text-sm">
            I agree to receive daily spiritual messages and Bible verses. Message and data rates may apply. 
            Reply STOP to unsubscribe.
          </span>
        </label>
      </div>
      <button
        type="submit"
        disabled={loading || !consent}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Subscribing...' : 'Subscribe to Daily Messages'}
      </button>
    </form>
  )
} 