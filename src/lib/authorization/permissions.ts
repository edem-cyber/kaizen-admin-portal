/**
 * Permission namespace and requisition status constants.
 *
 * Permissions follow a `<resource>:<action>` shape. Wildcards granted by
 * the backend:
 *   - `<resource>:*`   all actions on a resource
 *   - `admin:*`        super-wildcard (platform admin only)
 *
 * Only permissions the UI actually gates on are enumerated below. The
 * backend issues many additional strings (products, inventory, channels,
 * etc.) that aren't surfaced in this app yet — add new entries here as
 * features are built rather than free-typing permission strings at call
 * sites.
 */

export const PERMISSION = {
    // Kaizen Admins
    REQUISITIONS_READ: "requisitions:read",
    REQUISITIONS_WRITE: "requisitions:write",
    REQUISITIONS_DELETE: "requisitions:delete",
    REQUISITIONS_SUBMIT: "requisitions:submit",
    REQUISITIONS_APPROVE: "requisitions:approve",
    REQUISITIONS_REJECT: "requisitions:reject",

    // Budgets
    BUDGETS_READ: "budgets:read",
    BUDGETS_WRITE: "budgets:write",
    BUDGETS_DELETE: "budgets:delete",
    BUDGETS_APPROVE: "budgets:approve",

    // Vendors
    VENDORS_READ: "vendors:read",
    VENDORS_WRITE: "vendors:write",
    VENDORS_DELETE: "vendors:delete",
    VENDORS_APPROVE: "vendors:approve",

    // Committees
    COMMITTEES_READ: "committees:read",
    COMMITTEES_WRITE: "committees:write",
    COMMITTEES_VOTE: "committees:vote",

    // Configuration
    CONFIGURATION_READ: "configuration:read",
    CONFIGURATION_WRITE: "configuration:write",

    // Users
    USERS_READ: "users:read",
    USERS_WRITE: "users:write",

    // Discussions
    DISCUSSIONS_READ: "discussions:read",
    DISCUSSIONS_WRITE: "discussions:write",
    DISCUSSIONS_DELETE: "discussions:delete",

    // Documents
    DOCUMENTS_READ: "documents:read",
    DOCUMENTS_WRITE: "documents:write",
    DOCUMENTS_DELETE: "documents:delete",

    // Notifications
    NOTIFICATIONS_READ: "notifications:read",
    NOTIFICATIONS_WRITE: "notifications:write",

    // Payments
    PAYMENTS_READ: "payments:read",
    PAYMENTS_WRITE: "payments:write",
} as const;

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];

export const SUPER_WILDCARD_PERMISSION = "admin:*" as const;

/**
 * Kaizen Admin workflow statuses. Values match the generated
 * `Kaizen AdminStatus` enum (lowercase, snake_case). Kept in this module
 * because most status checks appear alongside permission checks in the
 * same helpers.
 */
export const REQUISITION_STATUS = {
    draft: "draft",
    submitted: "submitted",
    budget_validation: "budget_validation",
    pre_committee_approval: "pre_committee_approval",
    committee_review: "committee_review",
    post_committee_approval: "post_committee_approval",
    approved: "approved",
    rejected: "rejected",
    returned_for_modification: "returned_for_modification",
    cancelled: "cancelled",
} as const;

export type Kaizen AdminStatusValue =
    (typeof REQUISITION_STATUS)[keyof typeof REQUISITION_STATUS];

/**
 * Terminal states — no further action can be taken.
 */
export const TERMINAL_STATUSES: readonly Kaizen AdminStatusValue[] = [
    REQUISITION_STATUS.approved,
    REQUISITION_STATUS.rejected,
    REQUISITION_STATUS.cancelled,
];
