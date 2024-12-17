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
      const { error } = await supabase
        .from('subscribers')
        .insert([{ 
          phone_number: phoneNumber,
          consent_date: new Date().toISOString(),
          consent_ip: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(data => data.ip),
          opt_in_method: 'web_form',
          consent_message: 'I agree to receive daily spiritual messages and Bible verses. Message and data rates may apply. Reply STOP to unsubscribe.'
        }])

      if (error) throw error

      alert('Successfully subscribed to daily messages!')
      setPhoneNumber('')
      setConsent(false)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to subscribe')
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