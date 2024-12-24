// components/ui/styled-input.tsx

'use client';

import { Textarea } from "@nextui-org/react";
import { useTheme } from 'next-themes';

interface StyledInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  classNames?: {
    input?: string;
    inputWrapper?: string;
    [key: string]: string | undefined;
  };
  isClearable?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  "aria-label"?: string;
  minRows?: number;
  maxRows?: number;
}

export function StyledInput(props: StyledInputProps) {
  const { theme } = useTheme();
  
  const baseClasses = `
    flex-1 
    min-h-[80px] 
    rounded-lg
    mx-0
    my-0
    px-0
    py-0
    resize-none
    ${theme === 'dark' 
      ? 'bg-transparent text-white focus:border-0 focus:ring-0 border-0' 
      : 'bg-transparent text-gray-900 focus:border-0 focus:ring-0 border-0'
    } 
    shadow-inner 
    transition-colors 
    duration-200 
    ${props.className || ''}
  `;

  return (
    <Textarea
      {...props}
      className={baseClasses}
      classNames={{
        input: "px-4 py-2",
        inputWrapper: "bg-transparent dark:bg-transparent",
        ...(props.classNames || {})
      }}
      minRows={props.minRows || 1}
      maxRows={props.maxRows || 4}
    />
  );
} 