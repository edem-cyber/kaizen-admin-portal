"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// ============================================================================
// PROFILE PICTURE UTILITY
// ============================================================================

export interface ProfilePictureProps {
  /** URL of the profile image */
  src?: string | null;
  /** First name for generating initials */
  firstName?: string | null;
  /** Last name for generating initials */
  lastName?: string | null;
  /** Username fallback for generating initials */
  username?: string | null;
  /** Email fallback for generating initials */
  email?: string | null;
  /** Size variant */
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  /** Custom class for the container */
  containerClassName?: string;
  /** Custom class for the avatar */
  className?: string;
  /** Alt text for the image */
  alt?: string;
}

const profilePictureSizes = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  default: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-16 text-lg",
};

/**
 * ProfilePicture - A reusable avatar component that displays a user's profile picture
 * with fallback to initials when no image is available.
 *
 * @example
 * ```tsx
 * // With image URL
 * <ProfilePicture src="/avatar.jpg" firstName="John" lastName="Doe" />
 *
 * // Without image - shows initials
 * <ProfilePicture firstName="John" lastName="Doe" />
 *
 * // With username fallback
 * <ProfilePicture username="johndoe" />
 *
 * // With custom size
 * <ProfilePicture firstName="John" lastName="Doe" size="lg" />
 * ```
 */
export function ProfilePicture({
  src,
  firstName,
  lastName,
  username,
  email,
  size = "default",
  containerClassName,
  className,
  alt,
}: ProfilePictureProps) {
  // Generate initials from available data
  const getInitials = (): string => {
    // Try first name + last name
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    // Try just first name
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    // Try just last name
    if (lastName) {
      return lastName[0].toUpperCase();
    }
    // Try username
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    // Try email
    if (email) {
      return email[0].toUpperCase();
    }
    // Default fallback
    return "?";
  };

  // Generate background color based on name for visual distinction
  const getBackgroundColor = (): string => {
    const nameToUse = firstName || lastName || username || email || "";
    if (!nameToUse) return "bg-slate-200 dark:bg-slate-700";

    const colors = [
      "bg-violet-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-cyan-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-teal-500",
      "bg-orange-500",
    ];

    // Simple hash function to pick a consistent color
    let hash = 0;
    for (let i = 0; i < nameToUse.length; i++) {
      hash = nameToUse.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  const initials = getInitials();
  const bgColor = getBackgroundColor();
  const altText = alt || `${firstName || ""} ${lastName || ""}`.trim() || "User avatar";

  return (
    <Avatar
      size={size === "xs" || size === "xl" ? "default" : size}
      className={cn(profilePictureSizes[size], className)}
    >
      {src && <AvatarImage src={src} alt={altText} />}
      <AvatarFallback
        className={cn(
          "font-semibold text-white",
          bgColor,
          !src && "animate-in fade-in-0 duration-200"
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * getInitials - Helper function to get initials from name parts
 */
export function getInitials(firstName?: string | null, lastName?: string | null, username?: string | null, email?: string | null): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName[0].toUpperCase();
  }
  if (lastName) {
    return lastName[0].toUpperCase();
  }
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "?";
}

/**
 * getAvatarColor - Helper function to get a consistent avatar background color
 */
export function getAvatarColor(name: string): string {
  if (!name) return "bg-slate-200 dark:bg-slate-700";

  const colors = [
    "bg-violet-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-orange-500",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
}