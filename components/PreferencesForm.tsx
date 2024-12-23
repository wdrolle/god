// components/PreferencesForm.tsx
// This file is used to handle the preferences form
// It is used to display the preferences form in the dashboard page

"use client";

import { useState } from "react";
import { Button } from "@nextui-org/react";
import { Chip } from "@nextui-org/chip";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import dynamic from "next/dynamic";
import { SelectModal } from "components/ui/select-modal";

const BIBLE_VERSIONS = [
  { value: "NIV", label: "New International Version (NIV)" },
  { value: "ESV", label: "English Standard Version (ESV)" },
  { value: "KJV", label: "King James Version (KJV)" },
  { value: "NKJV", label: "New King James Version (NKJV)" },
  { value: "NLT", label: "New Living Translation (NLT)" },
];

const MESSAGE_LENGTHS = [
  { value: "SHORT", label: "Short (50-100 words)" },
  { value: "MEDIUM", label: "Medium (100-200 words)" },
  { value: "LONG", label: "Long (200-300 words)" },
];

const AVAILABLE_THEMES = [
  { value: "faith", label: "Faith" },
  { value: "love", label: "Love" },
  { value: "hope", label: "Hope" },
  { value: "wisdom", label: "Wisdom" },
  { value: "peace", label: "Peace" },
  { value: "strength", label: "Strength" },
  { value: "forgiveness", label: "Forgiveness" },
  { value: "gratitude", label: "Gratitude" },
];

interface PreferencesFormProps {
  initialPreferences: {
    preferred_bible_version: string;
    message_length_preference: string;
    theme_preferences: string[];
  };
  onSave: (preferences: any) => Promise<void>;
}

const ThemeToggle = dynamic(
  () => import("components/theme-toggle").then(mod => mod.ThemeToggle),
  {
    ssr: false,
  }
);

export function PreferencesForm({ initialPreferences, onSave }: PreferencesFormProps) {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(
    new Set(initialPreferences.theme_preferences)
  );

  const handleThemeToggle = (theme: string) => {
    const newThemes = new Set(selectedThemes);
    if (newThemes.has(theme)) {
      newThemes.delete(theme);
    } else {
      newThemes.add(theme);
    }
    setSelectedThemes(newThemes);
    setPreferences(prev => ({
      ...prev,
      theme_preferences: Array.from(newThemes)
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSave(preferences);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme
          </label>
          <ThemeToggle />
        </div>

        <SelectModal
          label="Bible Version to be Used"
          value={preferences.preferred_bible_version}
          options={BIBLE_VERSIONS}
          onChange={(value) => setPreferences(prev => ({
            ...prev,
            preferred_bible_version: value
          }))}
        />

        <SelectModal
          label="Message Length"
          value={preferences.message_length_preference}
          options={MESSAGE_LENGTHS}
          onChange={(value) => setPreferences(prev => ({
            ...prev,
            message_length_preference: value
          }))}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Themes
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_THEMES.map((theme) => (
              <Chip
                key={theme.value}
                variant={selectedThemes.has(theme.value) ? "solid" : "bordered"}
                color="primary"
                className="cursor-pointer"
                onClick={() => handleThemeToggle(theme.value)}
              >
                {theme.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <Button
        color="primary"
        className="w-full"
        onClick={handleSubmit}
        isLoading={isLoading}
      >
        Save Preferences
      </Button>
    </div>
  );
} 