import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidAvatarUrl(url?: unknown): boolean {
  if (!url) return false;
  if (typeof url !== "string") {
    return typeof Blob !== "undefined" && url instanceof Blob;
  }
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed.includes("placehold.co") ||
    trimmed.includes("placeholder")
  ) {
    return false;
  }
  return true;
}

export function cleanAvatarUrl(url?: unknown): string | null {
  if (typeof url === "string" && isValidAvatarUrl(url)) {
    return url.trim();
  }
  return null;
}

