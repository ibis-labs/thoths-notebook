import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the current date (or any Date) as a YYYY-MM-DD string in the
 * user's LOCAL timezone — not UTC. Use this instead of
 * `new Date().toISOString().slice(0, 10)` everywhere a calendar date is
 * recorded or compared against stored session dates.
 */
export function localDateStr(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
