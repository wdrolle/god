// lib/utils.ts
// This file is used to handle the utils
// It is used to handle the class names and the theme toggle

type ClassValue = string | number | boolean | undefined | null | { [key: string]: boolean };

export function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(' ');
} 