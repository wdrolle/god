"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@nextui-org/button"

interface ThemeToggleProps {
  variant?: "icon" | "text";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  if (variant === "text") {
    return (
      <Button
        variant="flat"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={`bg-transparent ${className}`}
      >
        {theme === "dark" ? (
          <div className="flex items-center gap-2">
            <Sun className="h-[1.2rem] w-[1.2rem]" />
            <span>Light Mode</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Moon className="h-[1.2rem] w-[1.2rem]" />
            <span>Dark Mode</span>
          </div>
        )}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      isIconOnly
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`rounded-full w-10 h-10 ${className}`}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 