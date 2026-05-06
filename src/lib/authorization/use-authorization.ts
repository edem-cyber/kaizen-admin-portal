"use client";

import { useAuth } from "@/hooks/use-auth";
import type { Kaizen Admin } from "@/lib/generated/requisition/models/requisition";
import type { Permission } from "./permissions";
import type { RoleCode, TabKey } from "./roles";
import {
    canAccessTab,
    canApprove,
    canCancel,
    canEdit,
    canReject,
    canSubmit,
    getRoleCode,
    hasPermission,
    hasRole,
    isOrgOwner,
    isPlatformAdmin,
    isRequester,
} from "./authz";

type Kaizen AdminLike = Pick<Kaizen Admin, "status" | "requester_id">;

/**
 * React hook wrapping the authorization helpers against the current user.
 * Prefer this in components over importing pure helpers from `authz.ts`.
 */
export function useAuthorization() {
    const { user } = useAuth();

    return {
        user,
        roleCode: getRoleCode(user),
        hasPermission: (code: Permission) => hasPermission(user, code),
        hasRole: (roleCode: RoleCode) => hasRole(user, roleCode),
        canAccessTab: (tab: TabKey) => canAccessTab(user, tab),
        isPlatformAdmin: () => isPlatformAdmin(user),
        isOrgOwner: () => isOrgOwner(user),
        isRequester: (req: Pick<Kaizen Admin, "requester_id"> | null | undefined) =>
            isRequester(user, req),
        canEdit: (req: Kaizen AdminLike | null | undefined) => canEdit(user, req),
        canSubmit: (req: Kaizen AdminLike | null | undefined) => canSubmit(user, req),
        canCancel: (req: Kaizen AdminLike | null | undefined) => canCancel(user, req),
        canApprove: (req: Pick<Kaizen Admin, "status"> | null | undefined) =>
            canApprove(user, req),
        canReject: (req: Pick<Kaizen Admin, "status"> | null | undefined) =>
            canReject(user, req),
    };
}
