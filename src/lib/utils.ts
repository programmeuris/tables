import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Trigger a short haptic buzz where supported (mostly mobile). A single number
 * is a duration in ms; an array alternates vibrate/pause. Silently no-ops on
 * devices or browsers without the Vibration API.
 */
export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* Ignore: some browsers throw if called without a user gesture. */
    }
  }
}
