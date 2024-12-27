'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function SignInPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only redirect if not already authenticated
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated') {
      router.replace('/bible-chat'); // or your default authenticated route
    }
  }, [router, status]);

  // Show loading state while checking session
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Please wait...</p>
      </div>
    </div>
  );
} 