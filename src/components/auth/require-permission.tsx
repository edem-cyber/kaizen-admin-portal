"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthorization, type Permission } from "@/lib/authorization";
import { showErrorToast } from "@/lib/toast";

interface RequirePermissionProps {
  /**
   * Permission code required to access the children. Matches exact,
   * `<resource>:*` wildcard, or `admin:*` super-wildcard.
   */
  permission: Permission;
  children: React.ReactNode;
  /**
   * Path to redirect to on failure. Defaults to `/admin`.
   */
  redirectTo?: string;
}

/**
 * Client-side permission guard. See `RequireRole` for the role-based
 * counterpart. Backend still enforces server-side.
 */
export function RequirePermission({
  permission,
  children,
  redirectTo = "/admin",
}: RequirePermissionProps) {
  const { user, hasPermission } = useAuthorization();
  const router = useRouter();
  const redirectedRef = useRef(false);

  const allowed = hasPermission(permission);

  useEffect(() => {
    if (!user) return;
    if (allowed || redirectedRef.current) return;

    redirectedRef.current = true;
    showErrorToast("You don't have permission to access that page.");
    router.push(redirectTo);
  }, [user, allowed, redirectTo, router]);

  if (!user || !allowed) return null;
  return <>{children}</>;
}
