// app/page.tsx
// This file is used to handle the home page
// It is used to display the home page

'use client'

import { useState } from 'react'
import { supabase } from './supabase'
import { PostgrestError } from '@supabase/supabase-js'
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {/* Your authenticated home page content */}
      <div>
        <h1>Welcome, {session.user?.name || session.user?.email}</h1>
        {/* Add your dashboard or home page components here */}
      </div>
    </main>
  )
} 