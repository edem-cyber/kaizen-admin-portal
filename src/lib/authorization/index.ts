/**
 * Authorization module.
 *
 * Two-layer rule:
 *   - Sidebar visibility      -> role (ROLE_TAB_VISIBILITY, canAccessTab)
 *   - Action authorization    -> permission (hasPermission, can*)
 *
 * See IMPLEMENTATION_PLAN.md for the full role x access matrix.
 */

export * from "./roles";
export * from "./permissions";
export * from "./authz";
export { useAuthorization } from "./use-authorization";
export { Can } from "./can";
