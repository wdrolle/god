'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import React from 'react';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-4">
          {error || 'An error occurred during authentication'}
        </p>
        <Link
          href="/auth/signup"
          className="text-blue-500 hover:text-blue-700"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
} 