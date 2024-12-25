// app/(main)/(routes)/dashboard/page.tsx
// This file is used to handle the dashboard page
// It is used to display the dashboard page

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Spinner } from "@nextui-org/spinner";
import { formatPhoneForDisplay } from "../../../../lib/utils/phone";
import { PreferencesForm } from "../../../../components/PreferencesForm";
import { toast } from 'sonner';

interface UserPreferences {
  theme_preferences: string[];
  blocked_themes: string[];
  preferred_bible_version: string;
  message_length_preference: string;
}

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  subscription_status: string;
  created_at: string;
  preferences?: {
    theme_preferences: string[];
    blocked_themes: string[];
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
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [prayer, setPrayer] = useState<string>("");
  const [showPrayer, setShowPrayer] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastPrayerTime, setLastPrayerTime] = useState<number>(0);
  const [displayedPrayer, setDisplayedPrayer] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Prayer generation function
  const generatePrayer = useCallback(async () => {
    const now = Date.now();
    if (now - lastPrayerTime < 60000) return;
    
    try {
      // Get preferences silently
      const prefResponse = await fetch('/api/user/profile');
      const prefData = await prefResponse.json();
      const bibleVersion = prefData?.preferences?.preferred_bible_version || 'KJV';
      
      // Generate prayer without showing loading state
      const response = await fetch('/api/prayer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: bibleVersion
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate prayer');
      }

      // Start typing animation with the new prayer
      const text = data.message;
      setShowPrayer(true);
      setIsTyping(true);
      setDisplayedPrayer('');
      
      // Type out the prayer character by character
      for (let i = 0; i <= text.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setDisplayedPrayer(text.slice(0, i));
      }

      // Update state after animation completes
      setPrayer(text);
      setLastPrayerTime(now);
      setIsTyping(false);
      
    } catch (error) {
      console.error('Error generating prayer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate prayer');
    }
  }, [lastPrayerTime]);

  // Prayer refresh interval
  useEffect(() => {
    // Generate initial prayer
    generatePrayer();

    // Set up interval
    const interval = setInterval(() => {
      generatePrayer();
    }, 60000);

    return () => clearInterval(interval);
  }, [generatePrayer]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        const data = await response.json();
        console.log('Raw user data:', {
          created_at: data.created_at,
          type: typeof data.created_at,
          parsed: new Date(data.created_at)
        });
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

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();
        setPreferences(data.preferences);
      } catch (error) {
        console.error('Error fetching preferences:', error);
        toast.error('Failed to load preferences');
      }
    };

    if (session?.user) {
      fetchPreferences();
    }
  }, [session]);

  const handleSavePreferences = async (newPreferences: Partial<UserPreferences>) => {
    setLoading(true);
    
    try {
      // Get current preferences with defaults
      const currentPreferences = {
        theme_preferences: userData?.preferences?.theme_preferences || [],
        blocked_themes: userData?.preferences?.blocked_themes || [],
        preferred_bible_version: userData?.preferences?.preferred_bible_version || 'NIV',
        message_length_preference: userData?.preferences?.message_length_preference || 'MEDIUM',
        ...newPreferences // Override with new values
      };

      // Add user preferences to UI immediately
      setUserData(prev => prev ? {
        ...prev,
        preferences: currentPreferences
      } : null);

      // Send to API
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPreferences)
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();
      
      // Update state with server response
      setUserData(prev => prev ? {
        ...prev,
        preferences: data.preferences
      } : null);

      toast.success('Preferences updated successfully');

    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
      
      // Revert optimistic update on error
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (themes: string[]) => {
    handleSavePreferences({
      theme_preferences: themes
    });
  };

  const handleBibleVersionChange = (version: string) => {
    handleSavePreferences({
      preferred_bible_version: version
    });
  };

  const handleMessageLengthChange = (length: string) => {
    handleSavePreferences({
      message_length_preference: length
    });
  };

  const handleBlockedThemesChange = (themes: string[]) => {
    handleSavePreferences({
      blocked_themes: themes
    });
  };

  const THEMES = ['faith', 'love', 'hope', 'wisdom', 'peace', 'strength', 'forgiveness', 'gratitude'];

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
    <div className="max-w-7xl mx-auto px-4 sm:px-2 lg:px-8 py-2 space-y-2">
      {/* User Info Section */}
      <div className="bg-card dark:bg-card rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-semibold mb-2">
          Welcome, {userData?.first_name || 'Guest'}!
        </h2>
        
        {/* Prayer Section */}
        <div className={`transition-opacity duration-1000 ${showPrayer ? 'opacity-100' : 'opacity-0'} pt-4 pb-4`}>
          <div className="bg-muted dark:bg-muted rounded-lg p-4 shadow-sm mb-5">
            <div className="prose dark:prose-invert max-w-none">
              <blockquote className="text-foreground italic leading-relaxed border-l-4 border-primary pl-6 mb-4">
                {displayedPrayer}
                {isTyping && (
                  <span className="animate-pulse ml-1">|</span>
                )}
              </blockquote>
            </div>
            {displayedPrayer && (
              <div className="text-sm text-muted-foreground">
                Based on {userData?.preferences?.preferred_bible_version || 'KJV'} translation
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-foreground">
              <span className="text-muted-foreground">Email:</span>{' '}
              {userData.email}
            </p>
            <p className="text-foreground">
              <span className="text-muted-foreground">Phone:</span>{' '}
              {userData.phone || 'Not provided'}
            </p>
            <p className="text-foreground">
              <span className="text-muted-foreground">Member Since:</span>{' '}
              {userData.created_at ? (
                (() => {
                  try {
                    // Log the parsing attempt
                    console.log('Parsing timestamp:', userData.created_at);
                    
                    const date = new Date(userData.created_at);
                    console.log('Parsed date:', date);
                    
                    if (isNaN(date.getTime())) {
                      console.error('Invalid date');
                      return 'Invalid date format';
                    }
                    
                    return date.toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'UTC'
                    });
                  } catch (error) {
                    console.error('Date parsing error:', error);
                    return 'Error parsing date';
                  }
                })()
              ) : 'Not available'}
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-foreground">
              <span className="text-muted-foreground">Name:</span>{' '}
              {userData.first_name} {userData.last_name}
            </p>
            <p className="text-foreground">
              <span className="text-muted-foreground">Subscription Status:</span>{' '}
              {userData.subscription_status || 'Not Active'}
            </p>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-card dark:bg-card rounded-lg shadow-sm p-8 pb-0">
        <h3 className="text-xl font-semibold mb-4">
          Manage Preferences
        </h3>

        <div className="space-y-4">
          {/* Theme Selection */}
          <div className="space-y-2 pt-2">
            <div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-2 pb-2"></div>
              <h4 className="text-lg font-medium mb-0 pt-2">Themes</h4>
              <p className="text-sm text-muted-foreground">
                Select the spiritual themes that resonate with you. These themes will guide the content of your daily messages,
                helping you receive more relevant and meaningful spiritual guidance. You can select multiple themes to create
                a personalized spiritual journey that addresses your current needs and interests.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pb-2">
              {THEMES.map((theme: string) => (
                <button
                  key={theme}
                  onClick={() => {
                    const currentThemes = (userData?.preferences?.theme_preferences || []).map((t: string) => t.toLowerCase());
                    const newThemes = currentThemes.includes(theme)
                      ? currentThemes.filter((t: string) => t !== theme)
                      : [...currentThemes, theme];
                    handleThemeChange(newThemes);
                  }}
                  className={`px-4 py-2 rounded-full transition-colors capitalize ${
                    (userData?.preferences?.theme_preferences || [])
                      .map((t: string) => t.toLowerCase())
                      .includes(theme)
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                  disabled={loading}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          {/* Bible Version Selection */}
          <div className="space-y-2 mt-4 pt-2">
            <div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-2 pb-2"></div>
              <h4 className="text-lg font-medium mb-0">
                Bible Version
              </h4>
              <p className="text-sm text-muted-foreground mb-0">
                Choose your preferred Bible translation for scripture references in your messages.
              </p>
            </div>
            <select
              value={userData?.preferences?.preferred_bible_version || 'KJV'}
              onChange={(e) => handleBibleVersionChange(e.target.value)}
              className="w-full max-w-xs p-2 rounded border bg-background"
              disabled={loading}
            >
              <option value="KJV">King James Version (KJV)</option>
              <option value="NIV">New International Version (NIV)</option>
              <option value="ESV">English Standard Version (ESV)</option>
            </select>
          </div>

          {/* Message Length Preference */}
          <div className="space-y-2 mt-4 pt-2">
            <div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-2 pb-2"></div>
              <h4 className="text-lg font-medium mb-0">
                Message Length
              </h4>
              <p className="text-sm text-muted-foreground mb-0">
                Select your preferred message length. This determines how detailed your daily spiritual messages will be.
              </p>
            </div>
            <select
              value={userData?.preferences?.message_length_preference || 'MEDIUM'}
              onChange={(e) => handleMessageLengthChange(e.target.value)}
              className="w-full max-w-xs p-2 rounded border bg-background"
              disabled={loading}
            >
              <option value="SHORT">Short (50-100 words)</option>
              <option value="MEDIUM">Medium (100-200 words)</option>
              <option value="LONG">Long (200-300 words)</option>
            </select>
          </div>

          {/* Content Filters */}
          <div className="space-y-2 mt-4 pt-2 pb-8">
            <div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-2 pb-2"></div>
              <h4 className="text-lg font-medium mb-0">
                Theme Filters
              </h4>
              <p className="text-sm text-muted-foreground mb-0">
                Select any themes you'd prefer not to receive in your messages. 
                These topics will be excluded from your daily spiritual content.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {['Faith', 'Love', 'Hope', 'Wisdom', 'Peace', 'Strength', 'Forgiveness', 'Gratitude'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => {
                    const currentBlocked = userData?.preferences?.blocked_themes || [];
                    const newBlocked = currentBlocked.includes(theme)
                      ? currentBlocked.filter(t => t !== theme)
                      : [...currentBlocked, theme];
                    handleBlockedThemesChange(newBlocked);
                  }}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    userData?.preferences?.blocked_themes?.includes(theme)
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  disabled={loading}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full">
          Saving...
        </div>
      )}
    </div>
  );
} 