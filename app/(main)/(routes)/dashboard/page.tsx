// app/(main)/(routes)/dashboard/page.tsx
// This file is used to handle the dashboard page
// It is used to display the dashboard page

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Spinner } from "@nextui-org/spinner";
import { formatPhoneForDisplay } from "../../../../lib/utils/phone";
import { ThemeProvider } from "../../../../components/providers/ThemeProvider";
import { ThemeToggle } from "../../../../components/theme-toggle";
import { PreferencesForm } from "../../../../components/PreferencesForm";

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  phone_country: string;
  subscription?: {
    status: string;
    preferred_time: string;
    next_message_at: string;
  };
  preferences?: {
    theme_preferences: string[];
    preferred_bible_version: string;
    message_length_preference: string;
  };
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  const handleSavePreferences = async (newPreferences: any) => {
    const response = await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPreferences),
    });

    if (!response.ok) {
      throw new Error('Failed to update preferences');
    }

    router.refresh();
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Error loading dashboard</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* User Info Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Welcome, {userData.first_name}!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 dark:text-gray-300">
                  Email: {userData.email}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Phone: {userData.phone_number ? formatPhoneForDisplay(userData.phone_number, userData.phone_country || 'US') : 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-300">
                  Subscription Status: {userData.subscription?.status || 'N/A'}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Next Message: {
                    userData.subscription?.next_message_at 
                    ? new Date(userData.subscription.next_message_at).toLocaleString() 
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Preferences
            </h3>
            <PreferencesForm
              initialPreferences={{
                preferred_bible_version: userData.preferences?.preferred_bible_version || 'NIV',
                message_length_preference: userData.preferences?.message_length_preference || 'MEDIUM',
                theme_preferences: userData.preferences?.theme_preferences || ['faith'],
              }}
              onSave={handleSavePreferences}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
} 