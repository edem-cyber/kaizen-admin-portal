"use client";

import type { ReactNode } from "react";
import { useAuthorization } from "./use-authorization";
import type { Permission } from "./permissions";
import type { RoleCode } from "./roles";

type CanProps = {
    children: ReactNode;
    fallback?: ReactNode;
} & (
    | { permission: Permission; role?: never }
    | { role: RoleCode; permission?: never }
);

/**
 * Conditionally render children based on a single permission or role.
 *
 * Pass `permission` OR `role` — not both. For AND/OR composition, nest
 * multiple `<Can>` elements or use `useAuthorization()` directly.
 *
 * Client-only: relies on the auth store. Do not use in Server Components.
 */
export function Can({ children, fallback = null, permission, role }: CanProps) {
    const auth = useAuthorization();

    const allowed =
        permission !== undefined
            ? auth.hasPermission(permission)
            : role !== undefined
                ? auth.hasRole(role)
                : false;

    return <>{allowed ? children : fallback}</>;
}
