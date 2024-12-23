'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React from 'react'
import ErrorImage from '@/assets/images/Jesus_Error_Page.png'

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md mb-8">
        <Image
          src={ErrorImage}
          alt="Authentication Error"
          width={400}
          height={300}
          priority
          className="mx-auto"
        />
      </div>

      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Authentication Error
        </h1>
        
        {error && (
          <p className="text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        
        <p className="text-gray-600 dark:text-gray-300">
          There was a problem with the authentication. Please try again or contact support if the problem persists.
        </p>
        
        <div className="pt-4">
          <Link 
            href="/login"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-500 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
} 