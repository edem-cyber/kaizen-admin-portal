"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthorization, type RoleCode } from "@/lib/authorization";
import { showErrorToast } from "@/lib/toast";

interface RequireRoleProps {
  /**
   * Single role code or list of acceptable role codes. Access is granted
   * if the current user matches any of them.
   */
  role: RoleCode | RoleCode[];
  children: React.ReactNode;
  /**
   * Path to redirect to on failure. Defaults to `/admin`.
   */
  redirectTo?: string;
}

/**
 * Client-side route guard. Redirects to `redirectTo` with a toast if the
 * current user's role isn't in the allowed list. Backend remains the
 * enforcement source of truth; this is UX + defense in depth.
 *
 * Usage: wrap page or layout contents.
 */
export function RequireRole({
  role,
  children,
  redirectTo = "/admin",
}: RequireRoleProps) {
  const { user, hasRole } = useAuthorization();
  const router = useRouter();
  const redirectedRef = useRef(false);

  const allowedRoles = Array.isArray(role) ? role : [role];
  const allowed = allowedRoles.some((code) => hasRole(code));

  useEffect(() => {
    // Wait until a user is loaded before deciding — mid-auth users
    // transiently look unauthorized.
    if (!user) return;
    if (allowed || redirectedRef.current) return;

    redirectedRef.current = true;
    showErrorToast("You don't have permission to access that page.");
    router.push(redirectTo);
  }, [user, allowed, redirectTo, router]);

  if (!user || !allowed) return null;
  return <>{children}</>;
}
