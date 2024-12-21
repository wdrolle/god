// components/ThemeToggle.tsx
// This file is used to handle the theme toggle
// It is used to display the theme toggle in the home page

"use client";

import React from "react";
import { Button } from "@nextui-org/react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

interface ThemeToggleProps {
  variant?: "icon" | "text";
  className?: string;
}

const ThemeToggle = ({ variant = "text", className = "" }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="flat"
      onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`bg-transparent ${className}`}
    >
      {variant === "icon" ? (
        theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        theme === "dark" ? (
          <div className="flex items-center gap-2 text-black dark:text-white">
            <Sun className="h-4 w-4" />
            <span>Light Mode</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>Dark Mode</span>
          </div>
        )
      )}
    </Button>
  );
};

export default ThemeToggle; 