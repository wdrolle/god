// lib/utils.ts
// This file is used to handle the utils
// It is used to handle the class names and the theme toggle

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 