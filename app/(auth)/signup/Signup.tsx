// app/(auth)/signup/Signup.tsx
// This file is used to handle the signup page
// It is used to create a new user account

"use client";

import { useState } from 'react'

interface SignupFormData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone: string
  country_code: string
}

const Signup = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    country_code: '',
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      {/* Other input fields for password, first_name, etc. */}
      <button type="submit">Sign Up</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Signup successful! Please check your email.</p>}
    </form>
  )
}

export default Signup