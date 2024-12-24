// components/ui/styled-input.tsx

'use client';

import { Input } from "@nextui-org/react";
import { useTheme } from 'next-themes';

interface StyledInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  isClearable?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  "aria-label"?: string;
}

export function StyledInput(props: StyledInputProps) {
  const { theme } = useTheme();
  
  const baseClasses = `flex-1 min-h-[50px] px-4 py-2 my-2 rounded-lg mx-0 ${
    theme === 'dark' 
      ? 'bg-gray-800/90 text-white focus:border-0 focus:ring-0 border-0' 
      : 'bg-gray-100/90 text-gray-900 focus:border-0 focus:ring-0 border-0'
  } shadow-inner transition-colors duration-200 ${props.className || ''}`;

  return (
    <Input
      {...props}
      className={baseClasses}
    />
  );
} 