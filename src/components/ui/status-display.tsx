"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// USER STATUS BADGES
// ============================================================================

export type UserStatusValue = "active" | "inactive" | "pending" | "disabled" | "suspended" | "verified" | "unverified";

const userStatusVariants = cva(
  "capitalize",
  {
    variants: {
      variant: {
        active: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        inactive: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
        pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
        disabled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
        suspended: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
        verified: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
        unverified: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
      },
    },
    defaultVariants: {
      variant: "inactive",
    },
  }
);

const USER_STATUS_COLORS: Record<UserStatusValue, { indicator: string; bg: string; text: string }> = {
  active: {
    indicator: "bg-green-500",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
  },
  inactive: {
    indicator: "bg-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-400",
  },
  pending: {
    indicator: "bg-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  disabled: {
    indicator: "bg-red-500",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
  },
  suspended: {
    indicator: "bg-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
  },
  verified: {
    indicator: "bg-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
  },
  unverified: {
    indicator: "bg-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-400",
  },
};

export interface UserStatusBadgeProps {
  /** The status to display */
  status: UserStatusValue;
  /** Whether to show an icon */
  showIcon?: boolean;
  /** Custom label (defaults to status) */
  label?: string;
  /** Custom class name */
  className?: string;
  /** Optional id attribute */
  id?: string;
  /** Test id for testing */
  "data-testid"?: string;
}

/**
 * UserStatusBadge - A standardized badge for displaying user account statuses
 *
 * @example
 * ```tsx
 * <UserStatusBadge status="active" />
 * <UserStatusBadge status="pending" showIcon />
 * <UserStatusBadge status="disabled" label="Account Disabled" />
 * ```
 */
export function UserStatusBadge({
  status,
  showIcon = false,
  label,
  className,
  ...props
}: UserStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(userStatusVariants({ variant: status }), className)}
      {...props}
    >
      {showIcon && (
        <span
          className={cn(
            "size-2 rounded-full mr-1.5",
            USER_STATUS_COLORS[status]?.indicator || "bg-slate-400"
          )}
        />
      )}
      {label || status}
    </Badge>
  );
}

/**
 * getUserStatusVariant - Helper function to get the badge variant for a user status
 */
export function getUserStatusVariant(status: string): UserStatusValue {
  const normalizedStatus = status?.toLowerCase() as UserStatusValue;
  if (["active", "inactive", "pending", "disabled", "suspended", "verified", "unverified"].includes(normalizedStatus)) {
    return normalizedStatus;
  }
  return "inactive";
}

// ============================================================================
// REQUISITION STATUS BADGES
// ============================================================================

export type Kaizen AdminStatusValue =
  | "draft"
  | "submitted"
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "cancelled"
  | "returned"
  | "processing"
  | "completed"
  | "on_hold";

const requisitionStatusVariants = cva(
  "capitalize",
  {
    variants: {
      variant: {
        draft: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
        submitted: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
        pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
        in_review: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
        approved: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        rejected: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
        cancelled: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
        returned: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
        processing: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
        completed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
        on_hold: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
      },
    },
    defaultVariants: {
      variant: "draft",
    },
  }
);

const REQUISITION_STATUS_CONFIG: Record<Kaizen AdminStatusValue, {
  indicator: string;
  label: string;
  description: string;
}> = {
  draft: {
    indicator: "bg-slate-400",
    label: "Draft",
    description: "Kaizen Admin is being prepared",
  },
  submitted: {
    indicator: "bg-blue-500",
    label: "Submitted",
    description: "Kaizen Admin has been submitted for review",
  },
  pending: {
    indicator: "bg-amber-500",
    label: "Pending",
    description: "Awaiting action or approval",
  },
  in_review: {
    indicator: "bg-cyan-500",
    label: "In Review",
    description: "Kaizen Admin is under review",
  },
  approved: {
    indicator: "bg-green-500",
    label: "Approved",
    description: "Kaizen Admin has been approved",
  },
  rejected: {
    indicator: "bg-red-500",
    label: "Rejected",
    description: "Kaizen Admin has been rejected",
  },
  cancelled: {
    indicator: "bg-gray-500",
    label: "Cancelled",
    description: "Kaizen Admin has been cancelled",
  },
  returned: {
    indicator: "bg-purple-500",
    label: "Returned",
    description: "Kaizen Admin has been returned for revision",
  },
  processing: {
    indicator: "bg-indigo-500",
    label: "Processing",
    description: "Kaizen Admin is being processed",
  },
  completed: {
    indicator: "bg-emerald-500",
    label: "Completed",
    description: "Kaizen Admin has been completed",
  },
  on_hold: {
    indicator: "bg-orange-500",
    label: "On Hold",
    description: "Kaizen Admin is on hold",
  },
};

export interface Kaizen AdminStatusBadgeProps {
  /** The status to display */
  status: Kaizen AdminStatusValue;
  /** Whether to show an icon */
  showIcon?: boolean;
  /** Custom label (defaults to formatted status) */
  label?: string;
  /** Show description as tooltip */
  showTooltip?: boolean;
  /** Custom class name */
  className?: string;
  /** Optional id attribute */
  id?: string;
  /** Test id for testing */
  "data-testid"?: string;
}

/**
 * Kaizen AdminStatusBadge - A standardized badge for displaying requisition statuses
 *
 * @example
 * ```tsx
 * <Kaizen AdminStatusBadge status="approved" />
 * <Kaizen AdminStatusBadge status="pending" showIcon />
 * <Kaizen AdminStatusBadge status="in_review" label="Under Review" />
 * ```
 */
export function Kaizen AdminStatusBadge({
  status,
  showIcon = false,
  label,
  className,
  ...props
}: Kaizen AdminStatusBadgeProps) {
  const config = REQUISITION_STATUS_CONFIG[status] || REQUISITION_STATUS_CONFIG.draft;

  return (
    <Badge
      variant="outline"
      className={cn(requisitionStatusVariants({ variant: status }), className)}
      title={config.description}
      {...props}
    >
      {showIcon && (
        <span
          className={cn(
            "size-2 rounded-full mr-1.5",
            config.indicator
          )}
        />
      )}
      {label || config.label}
    </Badge>
  );
}

/**
 * getKaizen AdminStatusVariant - Helper function to get the badge variant for a requisition status
 */
export function getKaizen AdminStatusVariant(status: string): Kaizen AdminStatusValue {
  const normalizedStatus = status?.toLowerCase().replace(/\s+/g, "_") as Kaizen AdminStatusValue;
  const validStatuses: Kaizen AdminStatusValue[] = [
    "draft", "submitted", "pending", "in_review", "approved", "rejected",
    "cancelled", "returned", "processing", "completed", "on_hold"
  ];

  if (validStatuses.includes(normalizedStatus)) {
    return normalizedStatus;
  }
  return "draft";
}

/**
 * getKaizen AdminStatusColor - Returns the indicator color class for a requisition status
 * Useful for status bars, charts, and other visual elements
 */
export function getKaizen AdminStatusColor(status: string): string {
  const variant = getKaizen AdminStatusVariant(status);
  return REQUISITION_STATUS_CONFIG[variant]?.indicator || "bg-slate-400";
}

/**
 * getKaizen AdminStatusLabel - Returns a human-readable label for a requisition status
 */
export function getKaizen AdminStatusLabel(status: string): string {
  const variant = getKaizen AdminStatusVariant(status);
  return REQUISITION_STATUS_CONFIG[variant]?.label || status;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  USER_STATUS_COLORS,
  REQUISITION_STATUS_CONFIG,
};