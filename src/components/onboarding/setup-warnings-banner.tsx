"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  canReadSetupStatus,
  canRunOnboardingWizard,
  getSetupStatus,
  setupStatusQueryKey,
  type SetupStatusResponse,
} from "@/lib/onboarding";
import { isPlatformAdmin } from "@/lib/authorization";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserDto } from "@/lib/generated/user/models/userDto";

/**
 * Soft banner surfacing setup-status warnings (e.g. no_fiscal_year_active)
 * and, as a fallback, unresolved blocking issues if the user is on a route
 * other than /onboarding. Blocking issues normally hard-redirect via the
 * dashboard layout's guard, but if that check fails (network error,
 * backend down), this banner is a backstop.
 *
 * Dismissed state is per-session (useState). Warnings reappear on next
 * mount.
 */
export function SetupWarningsBanner() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  const typedUser = user as UserDto | null;
  const organizationId = typedUser?.organizationId;

  const shouldCheck =
    !!typedUser &&
    !!organizationId &&
    !isPlatformAdmin(typedUser) &&
    canReadSetupStatus(typedUser);
  const canEdit = canRunOnboardingWizard(typedUser);

  const { data: status } = useQuery<SetupStatusResponse>({
    queryKey: organizationId
      ? setupStatusQueryKey(organizationId)
      : ["onboarding:setup-status", "_no_org"],
    queryFn: () => getSetupStatus(organizationId as number),
    // Skip the fetch on /onboarding since the banner is hidden there and
    // the wizard shell is already fetching the same query.
    enabled: shouldCheck && pathname !== "/onboarding",
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const message = useMemo(() => {
    if (!status) return null;
    if (status.blocking_issues.length > 0) {
      return {
        tone: "destructive" as const,
        text: canEdit
          ? "Your workspace isn't fully set up yet. Finish onboarding to start creating requisitions."
          : "Your workspace isn't fully set up yet. Your administrator needs to finish configuration before you can create requisitions.",
      };
    }
    if (status.warnings.length > 0) {
      const first = status.warnings[0];
      return {
        tone: "amber" as const,
        text: first.message,
      };
    }
    return null;
  }, [status, canEdit]);

  if (!shouldCheck) return null;
  if (pathname === "/onboarding") return null;
  if (dismissed) return null;
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm mb-4",
        message.tone === "destructive"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-amber-200 bg-amber-50 text-amber-900",
      )}
      role={message.tone === "destructive" ? "alert" : "status"}
    >
      <AlertTriangle
        className={cn(
          "h-4 w-4 shrink-0",
          message.tone === "destructive" ? "text-red-600" : "text-amber-600",
        )}
      />
      <span className="flex-1">{message.text}</span>
      {/* Warnings link to the wizard/pending view; for destructive tone,
          edit-capable users get "Open setup", read-only users get
          "See details" pointing at the pending-configuration view. */}
      <Link
        href="/onboarding"
        className={cn(
          "font-medium underline-offset-2 hover:underline shrink-0",
          message.tone === "destructive" ? "text-red-700" : "text-amber-700",
        )}
      >
        {canEdit ? "Open setup" : "See details"}
      </Link>
      {message.tone === "amber" && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-900 shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
