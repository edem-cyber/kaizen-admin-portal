"use client";

import { useAuth } from "@/hooks/use-auth";
import type { KaizenAdmin } from "@/lib/generated/kaizenAdmin/models/kaizenAdmin";
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

type KaizenAdminLike = Pick<KaizenAdmin, "status" | "requester_id">;

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
        isRequester: (req: Pick<KaizenAdmin, "requester_id"> | null | undefined) =>
            isRequester(user, req),
        canEdit: (req: KaizenAdminLike | null | undefined) => canEdit(user, req),
        canSubmit: (req: KaizenAdminLike | null | undefined) => canSubmit(user, req),
        canCancel: (req: KaizenAdminLike | null | undefined) => canCancel(user, req),
        canApprove: (req: Pick<KaizenAdmin, "status"> | null | undefined) =>
            canApprove(user, req),
        canReject: (req: Pick<KaizenAdmin, "status"> | null | undefined) =>
            canReject(user, req),
    };
}
