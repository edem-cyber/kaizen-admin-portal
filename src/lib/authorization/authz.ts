/**
 * Authorization helpers. Pure functions, no React dependency.
 *
 * Every helper returns `false` when the user, their role, or their
 * permission list is missing. No permissive defaults — mid-auth states
 * must not briefly expose gated UI.
 *
 * Backend enforces the same rules server-side; these helpers are
 * defense in depth and UX.
 */

import type { UserDto } from "@/lib/generated/user/models/userDto";
import type { KaizenAdmin } from "@/lib/generated/kaizenAdmin/models/kaizenAdmin";
import { ROLE_TAB_VISIBILITY, type RoleCode, type TabKey } from "./roles";
import {
    PERMISSION,
    REQUISITION_STATUS,
    SUPER_WILDCARD_PERMISSION,
    TERMINAL_STATUSES,
    type Permission,
    type KaizenAdminStatusValue,
} from "./permissions";

/**
 * The generated `OrganizationDto.type` is `{ [k: string]: unknown }`,
 * so accessing `type.admin` or `type.code` is not type-safe by default.
 * This interface is the one place that structural knowledge lives.
 */
interface OrgTypeShape {
    admin?: boolean;
    code?: string;
}

type Nullable<T> = T | null | undefined;

function getOrgType(user: Nullable<UserDto>): OrgTypeShape | undefined {
    const org = user?.organization as { type?: OrgTypeShape } | undefined;
    return org?.type;
}

// --- Identity helpers ----------------------------------------------------

export function getRoleCode(user: Nullable<UserDto>): RoleCode | undefined {
    const code = user?.organizationRole?.code;
    return code as RoleCode | undefined;
}

export function getPermissions(user: Nullable<UserDto>): string[] {
    return user?.organizationRole?.permissions ?? [];
}

export function hasRole(user: Nullable<UserDto>, roleCode: RoleCode): boolean {
    return getRoleCode(user) === roleCode;
}

/**
 * Check if the user holds a permission. Matches in priority order:
 *   1. global wildcard `*`
 *   2. super-wildcard `admin:*` (platform admin)
 *   3. resource wildcard `<resource>:*`
 *   4. exact `<resource>:<action>`
 */
export function hasPermission(
    user: Nullable<UserDto>,
    code: Permission,
): boolean {
    const perms = getPermissions(user);
    if (perms.length === 0) return false;
    if (perms.includes("*")) return true;
    if (perms.includes(SUPER_WILDCARD_PERMISSION)) return true;

    const colon = code.indexOf(":");
    if (colon !== -1) {
        const resourceWildcard = `${code.slice(0, colon)}:*`;
        if (perms.includes(resourceWildcard)) return true;
    }

    return perms.includes(code);
}

export function isPlatformAdmin(user: Nullable<UserDto>): boolean {
    const type = getOrgType(user);
    if (!type) return false;
    if (type.admin === true) return true;
    return type.code === "PLATFORM_ADMIN";
}

export function isOrgOwner(user: Nullable<UserDto>): boolean {
    return user?.isOwner === true;
}

// --- Navigation helpers --------------------------------------------------

export function canAccessTab(user: Nullable<UserDto>, tab: TabKey): boolean {
    const role = getRoleCode(user);
    if (!role) return false;
    return ROLE_TAB_VISIBILITY[role]?.includes(tab) ?? false;
}

// --- KaizenAdmin predicates ---------------------------------------------

type KaizenAdminLike = Pick<KaizenAdmin, "status" | "requester_id">;

function statusOf(
    req: Nullable<Pick<KaizenAdmin, "status">>,
): KaizenAdminStatusValue | undefined {
    return req?.status as KaizenAdminStatusValue | undefined;
}

export function isDraft(req: Nullable<Pick<KaizenAdmin, "status">>): boolean {
    return statusOf(req) === REQUISITION_STATUS.draft;
}

export function isReturnedForModification(
    req: Nullable<Pick<KaizenAdmin, "status">>,
): boolean {
    return statusOf(req) === REQUISITION_STATUS.returned_for_modification;
}

export function isTerminal(req: Nullable<Pick<KaizenAdmin, "status">>): boolean {
    const s = statusOf(req);
    return s !== undefined && TERMINAL_STATUSES.includes(s);
}

export function isRequester(
    user: Nullable<UserDto>,
    req: Nullable<Pick<KaizenAdmin, "requester_id">>,
): boolean {
    if (!user?.id || !req?.requester_id) return false;
    return user.id === req.requester_id;
}

/**
 * Requester can edit drafts and kaizenAdmins returned for modification.
 * Permission isn't additionally required — owning the record is enough
 * because non-draft, non-returned states don't accept edits at all.
 */
export function canEdit(
    user: Nullable<UserDto>,
    req: Nullable<KaizenAdminLike>,
): boolean {
    if (!req) return false;
    return (isDraft(req) || isReturnedForModification(req)) && isRequester(user, req);
}

export function canSubmit(
    user: Nullable<UserDto>,
    req: Nullable<KaizenAdminLike>,
): boolean {
    return canEdit(user, req) && hasPermission(user, PERMISSION.REQUISITIONS_SUBMIT);
}

/**
 * Cancel is broader than edit — available on every non-terminal status.
 * Either the requester (always) or a user with `kaizenAdmins:write`
 * (e.g. admin intervention on someone else's kaizenAdmin).
 */
export function canCancel(
    user: Nullable<UserDto>,
    req: Nullable<KaizenAdminLike>,
): boolean {
    if (!req || isTerminal(req)) return false;
    return isRequester(user, req) || hasPermission(user, PERMISSION.REQUISITIONS_WRITE);
}

export function canApprove(
    user: Nullable<UserDto>,
    req: Nullable<Pick<KaizenAdmin, "status">>,
): boolean {
    if (!req || isTerminal(req) || isDraft(req)) return false;
    return hasPermission(user, PERMISSION.REQUISITIONS_APPROVE);
}

export function canReject(
    user: Nullable<UserDto>,
    req: Nullable<Pick<KaizenAdmin, "status">>,
): boolean {
    if (!req || isTerminal(req) || isDraft(req)) return false;
    return hasPermission(user, PERMISSION.REQUISITIONS_REJECT);
}
