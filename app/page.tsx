// app/page.tsx
// This file is used to handle the home page
// It is used to display the home page

'use client'

import { useState } from 'react'
import { supabase } from './supabase'
import { PostgrestError } from '@supabase/supabase-js'

export default function Home() {
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setStatus('')
    
    try {
      // Validate phone number format
      if (!phone.match(/^\+[1-9]\d{1,14}$/)) {
        throw new Error('Please enter a valid phone number starting with + (e.g., +1234567890)')
      }

      const { data, error: supabaseError } = await supabase
        .from('god_subscriptions')
        .insert([{ phone_number: phone }])
        .select()

      if (supabaseError) {
        if (supabaseError.code === '23505') { // Unique violation
          throw new Error('This phone number is already subscribed')
        }
        throw new Error(supabaseError.message)
      }

      setStatus('Successfully subscribed!')
      setPhone('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe. Please try again.'
      setError(errorMessage)
      console.error('Subscription error:', err)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Daily Spiritual Messages
        </h1>
        
        <form onSubmit={handleSubscribe} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
              className="w-full p-2 border rounded"
              pattern="^\+[1-9]\d{1,14}$"
              title="Please enter a valid phone number starting with + (e.g., +1234567890)"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Subscribe
          </button>
        </form>

        {status && (
          <p className="mt-4 text-center text-green-600">
            {status}
          </p>
        )}

        {error && (
          <p className="mt-4 text-center text-red-600">
            {error}
          </p>
        )}
      </div>
    </main>
  )
} 