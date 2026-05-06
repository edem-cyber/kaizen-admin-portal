# Role-Based UI Implementation Plan

Bring the web app to parity with the Flutter mobile app's role model (Corporate Admin / Approver / Employee) while preserving the platform admin surface, subscription wall, and payment flows that only exist on web.

## Status

All phases and all mobile-parity items have shipped. Build green throughout.

| Phase | Scope | Status |
|---|---|---|
| 0 | Data verification (role codes, permissions, status casing, requester field) | ✅ |
| 1 | Authorization foundation (`src/lib/authorization/`) + rewire | ✅ |
| 2 | Sidebar filter + route guards | ✅ |
| 3 | Kaizen Admin detail action gating | ✅ |
| 4 | Vendor permission-based gating | ✅ |
| 5 | Admin configuration hub (`/configuration/`) — 7 sub-PRs | ✅ |
| 6 | Discussions per requisition | ✅ |
| 7 | Notifications SSE | ✅ |

| Mobile parity item | Surface | Status |
|---|---|---|
| — | `extractErrorMessage` extracted to `@/lib/api-error` | ✅ |
| 1 | Approval Levels: description, same-dept, secondary approver | ✅ |
| 2 | Committee Settings inline on `/configuration/committees` | ✅ |
| 3 | `/configuration/default-approvers` (singleton) | ✅ |
| 4a | `/configuration/budgets` (full CRUD + status change) | ✅ |
| 4b | `/configuration/allocation-rules` (FY-scoped CRUD) | ✅ |
| 5.0 | Budget Rules fetch-merge-PUT fix (prerequisite for 5) | ✅ |
| 5 | `/configuration/accounting` (ERP / POs / tax / currency) | ✅ |
| 6 | Budget Upload dialog on `/configuration/budgets` | ✅ |

The configuration hub has **11 sections**: approval-levels, default-approvers, committees, budgets, allocation-rules, budget-rules, accounting, workflow, policy, fiscal-year, plus the landing page.

## Context

Today the web app's role and permission checks are scattered, inconsistent, and partially stubbed:

- `src/app/(dashboard)/layout.tsx:13-16` has a `LocalOrganizationRole` cast because the Orval-generated `OrganizationRole` type doesn't match the runtime shape.
- `isPlatformAdmin` logic is duplicated inline at `src/app/(auth)/login/page.tsx:77-83` and `src/app/(dashboard)/layout.tsx:75-83`.
- `src/app/(dashboard)/requisitions/[id]/page.tsx:137` has `const canApprove = isPending; // Simplify for now, should check if user is in approval chain` — a placeholder shipped as code.
- `src/services/subscription/types.ts:84-99` lists `ROLE_PLATFORM_ADMIN` and `ROLE_SUPER_ADMIN` in `EXEMPT_ROLES`, but those strings are never returned by the backend — the substring match on `"ADMINISTRATOR"` is what actually catches the platform admin.
- The sidebar in `src/components/application-shell.tsx` is static: every authenticated user sees every menu item regardless of role.
- Vendor actions render unconditionally even though `vendors:delete` and `vendors:approve` are admin-only permissions.

This plan replaces the ad-hoc checks with a single authorization module, filters the sidebar by role, and gates actions by permission.

## Data model (verified against real login payloads)

### Roles

| Role code | Org type | Scope |
|---|---|---|
| `ROLE_ADMINISTRATOR` | `PLATFORM_ADMIN` | Platform admin — web-only surface at `(admin)` |
| `ROLE_CORPORATE_ADMIN` | `CORPORATE_CUSTOMER` | Full org admin |
| `ROLE_CORPORATE_APPROVER` | `CORPORATE_CUSTOMER` | Approver (payload unverified — see Phase 0) |
| `ROLE_CORPORATE_EMPLOYEE` | `CORPORATE_CUSTOMER` | Requester |

### Permissions

- Shape: flat `string[]` on `user.organizationRole.permissions`.
- Format: `resource:action`, e.g. `requisitions:approve`, `vendors:write`.
- Wildcards: `resource:*` grants all actions on a resource; `admin:*` is a super-wildcard. Both observed on platform admin only.
- The JWT access token also carries `platformUser: boolean`, `roleCode`, `organizationTypeCode`, and `permissions` claims. The web code uses the decoded `user` object, not the token claims — consistent with what the backend returns on `/users/self`.

### Platform admin detection

`user.organization.type.admin === true` is the canonical signal (boolean, populated). Fallback: `user.organization.type.code === "PLATFORM_ADMIN"`. Do **not** check `permissions.includes("platform:admin")` — redundant with the above.

### Organization owner

`user.isOwner: true` identifies the original signup user for the org, distinct from role. Verified: Platform Admin and Corporate Admin both show `isOwner: true`; a Corporate Employee in the same org shows `isOwner: false`. Use for org-destructive paths (e.g. `/settings/subscription` write actions).

### Kaizen Admin model

From `src/lib/generated/requisition/models/`:

- Fields are **snake_case** (the requisition service is Python/FastAPI-style; user/org services are camelCase).
- `requester_id: string` (required) — use for ownership checks.
- `Kaizen AdminStatus` is lowercase with underscores:
  ```
  draft | submitted | budget_validation | pre_committee_approval
  | committee_review | post_committee_approval | approved | rejected
  | returned_for_modification | cancelled
  ```
- Terminal states: `approved`, `rejected`, `cancelled`. All others are non-terminal.
- `returned_for_modification` should be editable by the requester (not just `draft`).

## Role × access matrix

Sidebar visibility is a UX choice. Route-level guards and in-page action gates are the security boundary. Backend is the final source of truth — client gates are defense in depth.

| Surface | Admin | Approver | Employee | Gate mechanism |
|---|:---:|:---:|:---:|---|
| `/admin` | sidebar + full | sidebar + full | sidebar + full | none (data filtered server-side) |
| `/requisitions` (My Kaizen Admins) | sidebar + full | sidebar + full | sidebar + full | status + requester for actions |
| `/requisitions/new` | sidebar + full | sidebar + full | sidebar + full | `requisitions:write` |
| `/requisitions/[id]` | full | full | full | `canEdit`/`canSubmit`/`canCancel` per helpers |
| `/approvals` | sidebar + full | sidebar + full | hidden + blocked | `RequirePermission('requisitions:approve')` |
| `/vendors` | sidebar + full | sidebar + full | sidebar + add/edit | `<Can>` per `vendors:write` / `:delete` / `:approve` |
| `/budget` | sidebar + write | sidebar + read | hidden + read-only (URL) | `<Can>` per `budgets:write` |
| `/analytics` | sidebar + full | sidebar + full | hidden + blocked | `RequireRole` admin-or-approver |
| `/users` (team) | sidebar + full | sidebar + full | hidden + blocked | `RequireRole` admin-or-approver |
| `/configuration` (new admin hub) | sidebar + full | hidden + blocked | hidden + blocked | `RequireRole` admin-only |
| `/notifications` | sidebar | sidebar | sidebar | none |
| `/settings` | sidebar | sidebar | sidebar | none (personal) |
| `/settings/subscription` | sidebar (owner-only write) | hidden + blocked | hidden + blocked | `isOrgOwner` for write paths |

**Two-layer rule:**

1. **Sidebar visibility** is keyed off `ROLE_TAB_VISIBILITY[roleCode]`. Unknown role → no tabs.
2. **Action authorization** is keyed off permissions via `hasPermission(user, code)`. Backend enforces same rules on API calls.

Sidebar and actions are deliberately *not* redundant. A role may have a permission (e.g. Employee has `vendors:write`) without the corresponding tab being the right UX surface for the action (team management on `/users` is hidden from Employee despite their `users:write` permission being valid for self-service on `/settings`).

## Phase 0 — remaining verifications

Pre-reqs before Phase 1:

- [ ] Approver login payload. Expected role code `ROLE_CORPORATE_APPROVER`, `isOwner: false`, permission subset = Employee + `requisitions:approve`, `requisitions:reject`, `budgets:approve`, `vendors:approve`, `committees:vote`. **Assumed accepted for planning**; Phase 1 code lands with a `// TODO(phase-0): verify against live Approver payload` comment next to the Approver entry in the role map.
- [x] Corporate Admin payload verified.
- [x] Platform Admin payload verified.
- [x] Employee payload verified.
- [x] `Kaizen AdminStatus` casing verified (lowercase with underscores).
- [x] `requester_id` field verified (`src/lib/generated/requisition/models/requisition.ts:29`).
- [x] `requiresSubscription` / `checkSubscriptionStatus` callers enumerated:
  - `src/app/(dashboard)/layout.tsx:86, 108, 141`
  - `src/app/(auth)/payment-success/page.tsx:81`
  - `src/services/subscription/subscription.service.ts:24, 378` (internal)

## Phase 1 — authorization foundation

New module at `src/lib/authorization/`. Pure functions + a hook + a component.

### Files

**`roles.ts`**
- `ROLE` const:
  ```
  ROLE.ADMINISTRATOR        = "ROLE_ADMINISTRATOR"
  ROLE.CORPORATE_ADMIN      = "ROLE_CORPORATE_ADMIN"
  ROLE.CORPORATE_APPROVER   = "ROLE_CORPORATE_APPROVER"
  ROLE.CORPORATE_EMPLOYEE   = "ROLE_CORPORATE_EMPLOYEE"
  ```
- `TAB` const keys: `dashboard`, `requisitions`, `approvals`, `vendors`, `budget`, `analytics`, `users`, `configuration`, `notifications`, `settings`.
- `TAB_ROUTES: Record<TabKey, string>` mapping tab → URL.
- `ROLE_TAB_VISIBILITY: Record<RoleCode, TabKey[]>` from the matrix above. Unknown role → `[]`.

**`permissions.ts`**
- `Permission` type — union of the `resource:action` strings we gate on (~25 values). Open string-literal wildcards (`"requisitions:*"`) typed separately as `WildcardPermission`.
- `REQUISITION_STATUS` const (lowercase, snake_case per generated model).
- `TERMINAL_STATUSES` set: `['approved', 'rejected', 'cancelled']`.

**`authz.ts`** — pure functions. All return `false` when `user`, `user.organizationRole`, or `user.organizationRole.permissions` is missing. No permissive defaults.

```
getRoleCode(user)              // single place with the cast to access role.code
hasRole(user, roleCode)        // strict equality
hasPermission(user, code)      // exact match OR <resource>:* OR admin:*
isPlatformAdmin(user)          // organization.type.admin === true || type.code === "PLATFORM_ADMIN"
isOrgOwner(user)               // user.isOwner === true
isRequester(user, req)         // user.id === req.requester_id
canAccessTab(user, tabKey)     // ROLE_TAB_VISIBILITY[roleCode]?.includes(tabKey) ?? false

// Kaizen Admin action predicates
isDraft(req)                   // status === 'draft'
isReturnedForMod(req)          // status === 'returned_for_modification'
isTerminal(req)                // TERMINAL_STATUSES.includes(status)

canEdit(user, req)    = (isDraft(req) || isReturnedForMod(req)) && isRequester(user, req)
canSubmit(user, req)  = canEdit(user, req) && hasPermission(user, 'requisitions:submit')
canCancel(user, req)  = !isTerminal(req) && (isRequester(user, req) || hasPermission(user, 'requisitions:write'))
canApprove(user, req) = !isTerminal(req) && !isDraft(req) && hasPermission(user, 'requisitions:approve')
canReject(user, req)  = !isTerminal(req) && !isDraft(req) && hasPermission(user, 'requisitions:reject')
```

**`use-authorization.ts`** — React hook `useAuthorization()` wrapping `useAuth()` and exposing the above helpers curried with the current user.

**`can.tsx`** — client component. MVP API:
```
<Can permission={Permission} fallback={ReactNode?}>...</Can>
<Can role={RoleCode} fallback={ReactNode?}>...</Can>
```
Single prop (permission *or* role, not both). No array variants. If composition is needed, nest `<Can>` or use `useAuthorization()` directly.

### Rewire existing call sites (part of Phase 1 PR)

- `src/app/(auth)/login/page.tsx:77-83` → replace inline check with `isPlatformAdmin(user)`.
- `src/app/(dashboard)/layout.tsx:13-16, 72-83, 108-112, 141`:
  - Delete `LocalOrganizationRole` interface and the `as unknown as` cast.
  - Use `isPlatformAdmin(user)`.
  - Pass `user` to `SubscriptionService.checkSubscriptionStatus`.
- `src/app/(auth)/payment-success/page.tsx:81` → pass `user`.
- `src/services/subscription/subscription.service.ts:24, 369-425`:
  - Rewrite `requiresSubscription(user: User)` and `checkSubscriptionStatus({ user, organizationId })`.
  - Replace the `roleCode.includes("ADMINISTRATOR")` substring match with `isPlatformAdmin(user)`.
  - Delete `ROLE_PLATFORM_ADMIN` and `ROLE_SUPER_ADMIN` from `EXEMPT_ROLES` in `src/services/subscription/types.ts` — they're dead entries. `EXEMPT_ORG_TYPES` stays as a re-export from `roles.ts`.
- `src/stores/auth-store.ts:75-109`:
  - Rename `devLogin` to `devLoginAs(roleCode?: RoleCode)`.
  - Include a realistic `organizationRole` with `code` and `permissions` in the mock user.
  - Support all four roles: platform admin, corporate admin, approver, employee.
  - Default (no arg) = Corporate Admin for backward compatibility with existing callers.

### Acceptance

- `npm run lint` clean.
- `npm run build` clean.
- `devLoginAs("ROLE_CORPORATE_EMPLOYEE")` produces a user whose `canAccessTab(user, "approvals")` returns `false`.
- No behavioral change at any existing call site — Phase 1 is pure refactor.

## Phase 2 — sidebar filter + route guards

### Sidebar

File: `src/components/application-shell.tsx`.

- Attach `tabKey: TabKey` to each nav item.
- Filter items with `canAccessTab(user, item.tabKey)`.
- Add new nav items: Analytics (admin+approver), Budget (admin+approver), Configuration (admin only).
- Delete `src/components/application-shell1.tsx` after confirming no importers.

### Route guards

New client components in `src/components/auth/`:

- `require-role.tsx` — `<RequireRole role={RoleCode | RoleCode[]}>` redirects to `/admin` with a toast on mismatch.
- `require-permission.tsx` — `<RequirePermission permission={Permission}>` same pattern.

Apply:

| Route | Guard |
|---|---|
| `src/app/(dashboard)/approvals/page.tsx` + `/history` | `RequirePermission("requisitions:approve")` |
| `src/app/(dashboard)/analytics/**` (layout) | `RequireRole([CORPORATE_ADMIN, CORPORATE_APPROVER])` |
| `src/app/(dashboard)/users/**` (layout) | `RequireRole([CORPORATE_ADMIN, CORPORATE_APPROVER])` |
| `src/app/(dashboard)/configuration/**` (layout, Phase 5) | `RequireRole(CORPORATE_ADMIN)` |
| `src/app/(dashboard)/settings/subscription/**` | Custom guard: `isOrgOwner(user)` for write paths |

`/budget` and `/vendors` are URL-accessible to all authenticated users; action-level gates (Phase 3/4) handle read-only downgrades.

### Acceptance

- Log in as each role; sidebar matches the matrix exactly.
- Typing a blocked URL redirects to `/admin` with toast.
- `(admin)` route group untouched; platform admin redirect still works.

## Phase 3 — requisition detail action gating

File: `src/app/(dashboard)/requisitions/[id]/page.tsx`.

- Remove the `canApprove = isPending` stub.
- Remove Approve/Reject/Return buttons from the detail page — those live only on `/approvals`.
- Wire Edit, Submit, Cancel buttons to `canEdit(user, req)`, `canSubmit(user, req)`, `canCancel(user, req)` from Phase 1.
- Extend Cancel handling to all non-terminal statuses (current code only shows it on draft).
- Use the snake_case fields from the generated `Kaizen Admin` model: `requester_id`, `status`, etc.

### Acceptance

- Draft owned by logged-in user: Edit, Submit, Cancel all visible.
- Draft owned by someone else: none of Edit/Submit/Cancel visible.
- Approved requisition: no action buttons.
- `returned_for_modification`: Edit and Submit visible to requester.

## Phase 4 — vendor permission-based gating

Files: `src/app/(dashboard)/vendors/page.tsx`, `src/app/(dashboard)/vendors/[id]/page.tsx`, `src/components/vendors/*`.

Wrap each action in `<Can>`:

| Action | Permission |
|---|---|
| Add Vendor | `vendors:write` |
| Edit Vendor | `vendors:write` |
| Delete Vendor | `vendors:delete` |
| Approve/activate Vendor | `vendors:approve` |

Single `/vendors` surface for all roles. Employee gets Add/Edit (their permission set includes `vendors:write`); Admin gets everything; Approver gets Admin-level.

### Acceptance

- Employee sees Add/Edit but no Delete/Approve.
- Admin sees all four.
- Backend rejects unauthorized calls (verified by negative test).

## Phase 5 — admin configuration hub (`/configuration/`)

New route segment `src/app/(dashboard)/configuration/`. Admin-only, role-gated by layout.

### Structure

- `configuration/layout.tsx` — wraps children in `<RequireRole role={CORPORATE_ADMIN}>`.
- `configuration/page.tsx` — landing with cards linking to each section.
- Subpages, backed by existing generated hooks:

| Subpath | Purpose | Generated hooks |
|---|---|---|
| `/configuration/approval-levels` | Approval chain setup (incl. secondary approver) | `configuration-v1` |
| `/configuration/default-approvers` | Singleton fallback approver | `configuration-v1` |
| `/configuration/committees` | Committee CRUD + global review thresholds | `committees-v1`, `configuration-v1` |
| `/configuration/budgets` | Budget entity CRUD + status + import | `budget-v1`, `configuration-v1` |
| `/configuration/allocation-rules` | FY-scoped percentage allocation rules | `budget-v1` |
| `/configuration/budget-rules` | Budget validation (guardrails subset of accounting) | `configuration-v1` |
| `/configuration/accounting` | ERP / POs / tax / currency | `configuration-v1` |
| `/configuration/workflow` | Read-only workflow visualization | `workflow-v1` |
| `/configuration/policy` | Vendor quote rules, bidding thresholds | `configuration-v1` |
| `/configuration/fiscal-year` | FY config + list + activation + create | `budget-v1` |

### Sequencing

Split into 4–6 sub-PRs:

1. Landing page + layout guard + nav entry (stub sections).
2. Approval levels.
3. Committees.
4. Budget rules + policy.
5. Workflow + fiscal year.

### Acceptance per sub-PR

- Admin sees and can open all sections.
- Non-admin redirected from any `/configuration/*` URL.
- Each section CRUD works against the generated hook.

### Deliberate deviation from mobile

Mobile renders admin settings as a single scrollable screen with sections. Web uses a sectioned multi-route hub. Reason: deep-linkable sections, browser back/forward, better suited to wide screens.

## Phase 6 — discussions per requisition

New segment: `src/app/(dashboard)/requisitions/[id]/discussions/` (or a tab within the detail page — decide during implementation based on design mocks).

Backed by `src/lib/generated/requisition/discussions-v1`.

Action gates:

| Action | Permission |
|---|---|
| View thread | `discussions:read` |
| Create thread / reply | `discussions:write` |
| Delete own comment | `discussions:delete` |

All three corporate roles carry all three discussion permissions; the gate is mostly future-proofing.

### Acceptance

- Thread list + detail render.
- Attachments upload.
- Delete button appears only for the comment's author.

## Phase 7 — notifications SSE

Verify current `src/app/(dashboard)/notifications/page.tsx` implementation.

- If polling or one-shot fetch, add an `EventSource` subscribing to the notifications stream endpoint with React Query cache invalidation on message.
- If already SSE, no work needed — mark phase done.

Independent of role work; can be sequenced separately.

## Cross-cutting

### Null-safety rule

Every helper in `authz.ts` defaults to **deny** when `user`, `user.organizationRole`, or `user.organizationRole.permissions` is missing. Permissive defaults are not acceptable — mid-auth states must not briefly expose gated UI.

### Deliberate deviations from mobile (document in PR descriptions)

1. Admin config is a sectioned multi-route hub on web (not a single scroll view).
2. Action gates combine **status + permission + requester ownership** (stricter than mobile, which uses status alone).
3. Vendor management is inline on `/vendors` with per-action permission gates (not a separate admin-only screen as in mobile).
4. Employee's `users:write` permission is treated as self-service scope; team-management UI is hidden and URL-blocked for Employees (matrix matches the stricter interpretation).

### Out of scope

- `src/app/(admin)/**` — platform admin portal stays untouched.
- Subscription wall mechanism and payment grace period — Phase 1 only rewires the helper signature; behavior unchanged.
- User-object cache staleness on role change — post-Phase-7 backlog. Mitigation: refetch `/users/self` on window focus, or push via SSE alongside notifications (Phase 7 naturally opens that channel).

### Testing

No test runner is configured in this repo. Per-phase acceptance is manual via `devLoginAs`:

- Phase 1: lint + build clean; no behavioral change at any call site.
- Phase 2: walk the matrix for each of the four roles.
- Phase 3: toggle requisition status via backend and verify action visibility.
- Phase 4: verify each permission combination in isolation.
- Phase 5: sub-PR acceptance criteria above.
- Phase 6–7: integration with live backend.

### CLAUDE.md update

After Phase 1 lands, append an "Authorization" section to `CLAUDE.md` pointing at `src/lib/authorization/` and documenting the two-layer pattern (sidebar = role, actions = permission).

### Commit hygiene

- One phase per PR (Phase 5 splits into sub-PRs).
- `npm run build` invokes `prebuild` which runs `generate:api` — API surface drift should be distinguishable from our changes. Snapshot `src/lib/generated/` before starting Phase 1; review unrelated diffs separately.

## Sequence and sizing

| # | Phase | Size | Blocks |
|---|---|---|---|
| 0 | Approver payload + sign-off | <1 day | 1+ |
| 1 | Authz module + rewire | 1 day | 2+ |
| 2 | Sidebar + guards | 1 day | 3, 4, 5 |
| 3 | Kaizen Admin action gating | ½ day | — |
| 4 | Vendor permission gates | ½ day | — |
| 5 | Configuration hub | 1–2 weeks (sub-PRs) | — |
| 6 | Discussions | 3–5 days | — |
| 7 | Notifications SSE | 1–2 days | — |

Phase 1 is the critical path. Phases 3, 4, 6, 7 can run in parallel once Phase 2 lands. Phase 5 is the largest and can start as soon as Phase 2 is in — its sub-PRs don't block each other.

---

# Mobile parity enhancements

After Phases 1–7 landed, a parity audit against the Flutter mobile app's `lib/screens/admin/admin_settings_screen.dart` surfaced seven gaps. Every gap has been verified against mobile source before implementation — mobile is the authoritative reference for both API shape and UX grouping.

## Prerequisite: `extractErrorMessage` helper

- `src/lib/api-error.ts` — single shared helper for `response.data.detail ?? response.data.message ?? fallback`.
- Retrofitted into approval-levels, committees, policy, budget-rules, fiscal-year pages, dropping ~40 lines of inline copies.
- All new configuration pages use it from the start.

## Item 1 — Approval Levels expansion

Backend model already exposed these fields; only the form + table needed extending.

- **Files:** `src/components/configuration/approval-level-form.tsx`, `src/app/(dashboard)/configuration/approval-levels/page.tsx`.
- **New fields:** `description` (Textarea), `same_department_required` (Switch), **Secondary approver** section — type Select (`none` / `role` / `individual`), conditional role/user dropdown, `secondary_budget_category` text input.
- **Validation:** zod superRefine requires secondary role/user when type is set.
- **Table:** new "Secondary" column with auto-derived display name; primary-row tags show "Requires all" / "Same dept" when set.
- `ApprovalLevelFormSubmit` type grew from 11 → 19 fields.

## Item 2 — Committee Settings (global, inline)

Verified from mobile: settings render at the top of the committees section, not a separate tab.

- **File:** `src/app/(dashboard)/configuration/committees/page.tsx` — local `CommitteeSettingsCard` component added above the committee table.
- **Hooks:** `useGetCommitteeSettingsApiV1ConfigurationOrganizationIdCommitteeSettingsGet` + matching Patch.
- **Fields:** `uses_committee_review` (Switch), `committee_review_threshold` (numeric, conditional), `committee_type` (text), `uses_post_committee_approval` (Switch), `post_committee_threshold` (numeric, conditional).
- Dedicated "Save Settings" button — independent of per-committee Save.

## Item 3 — Default Approvers

Singleton per org (confirmed from mobile: `DefaultApprover? _defaultApprover` single-nullable state; 404 handled as "no record yet").

- **File:** `src/app/(dashboard)/configuration/default-approvers/page.tsx` + landing card (`UserCheck` icon).
- **Hooks:** `useGetDefaultApproverApi…`, `useCreateDefaultApproverApi…` (POST, no id), `useUpdateDefaultApproverApi…` (PUT with approverId), `useDeleteDefaultApproverApi…`.
- **Fields:** `approval_type` (Select), conditional role/user dropdown, `description` (Textarea), `is_active` (Switch, edit-mode only). Backend uses role *name* not id — form maps id↔name internally.
- Create ↔ Edit detection via `hasExistingApprover = !!data?.id`. Remove button opens AlertDialog confirmation.

## Item 4a — Budget Entities

- **Files:** `src/components/configuration/budget-form.tsx`, `src/app/(dashboard)/configuration/budgets/page.tsx` + landing card (`PiggyBank`).
- **Hooks:** `useCreateBudgetApi…`, `useListBudgetsApi…`, `useUpdateBudgetApi…`, `useDeleteBudgetApi…`, `useUpdateBudgetStatusApi…Patch`.
- **Form fields:** `budget_code` (locked after creation), `budget_name`, `description`, `total_budget`, `currency_code`, `fiscal_year_id` (locked after creation; populated from FY list), `auto_approve_threshold`, `cost_center`, `project_code` (both create-only), `allow_overrun` switch with conditional `overrun_percentage` + `require_approval_on_overrun`.
- **Table columns:** Code · Name · Fiscal Year (id → name resolved) · Total (currency-formatted) · Utilization (progress bar + %) · Status · Actions.
- **Status change flow:** dedicated Dialog with status Select (5 values) + optional reason Textarea — calls the dedicated `:status` endpoint rather than bundling into Edit.
- **Deferred (documented):** `alert_thresholds` editor (opaque shape), `department_id` (no department-list API in web yet), `parent_budget_id` (hierarchical budgets).

## Item 4b — Allocation Rules

- **Files:** `src/components/configuration/allocation-rule-form.tsx`, `src/app/(dashboard)/configuration/allocation-rules/page.tsx` + landing card (`PieChart`).
- **Hooks:** `useCreateAllocationRuleApi…Post`, `useGetAllocationRulesApi…Get`, `usePatchAllocationRuleApi…Patch`, `useDeleteAllocationRuleApi…Delete`.
- **Page scope:** the GET endpoint requires `fiscal_year_id`, so the UX forces an FY picker at the top; all CRUD is scoped to that FY. `fiscal_year_id` is inherited into create so the form doesn't re-ask.
- **Percentages editor** (key point): `useFieldArray` of `{label, percentage}` rows with running total (green at 100%, amber under, red over), "Use template" button (populates labels per period type — monthly → Jan…Dec, quarterly → Q1…Q4, etc.), "Distribute evenly" button, duplicate-label detection.
- **Other fields:** `rule_name`, `description`, `period_type`, optional `department_id`, `enforce_strict_allocation` + `allow_period_reallocation` switches.
- **Table columns:** Rule (with strict/reallocatable tags) · Period type · Department · Allocation (badge list) · Status · Actions.

## Item 5.0 — Budget Rules fetch-merge-PUT fix (precursor)

Mobile uses `.copyWith()` to merge accounting-config changes onto the loaded full config before PUT. Web was sending only the edited subset, which would wipe fields managed elsewhere once Item 5 added a second editor.

- **File:** `src/app/(dashboard)/configuration/budget-rules/page.tsx`.
- **Change:** `toPayload(values, base)` now spreads `...(base ?? {})` before overlaying form fields. Policy page not touched (covers all its fields already, no risk).

## Item 5 — Accounting page

- **File:** `src/app/(dashboard)/configuration/accounting/page.tsx` + landing card (`Calculator`).
- **Reuses** `useGet/Create/UpdateAccountingConfigurationApi…` already used by Budget Rules — same record, different field subset.
- **Four Card sections:**
  1. **ERP integration** — `budget_erp_endpoint`, `utilization_erp_endpoint`, `po_erp_endpoint`, `budget_sync_frequency_hours` (1–168). **Test connection** button in the Card header calls `useTestErpConnectionApi…` with the first configured endpoint (budget → utilization → PO priority) and `{connection_type, endpoint}` params.
  2. **Purchase orders** — `purchase_order_mode` (online/offline), `po_number_prefix`, `po_auto_release`.
  3. **Tax** — `tax_inclusion` (included/excluded), `default_tax_rate` (0–100%).
  4. **Currency** — `default_currency` (auto-uppercased ISO 4217), `allow_multi_currency`, `supported_currencies` (chip editor: Input + Add button + Enter-to-add + X-to-remove, 3-char validation, dedup).
- **Same fetch-merge-PUT pattern** as Item 5.0 — spreads loaded config before overlaying form fields.
- **Deferred:** `tax_code_mapping` — mobile doesn't expose it either (verified: all mobile hits are inside `lib/services/generated/`, no screen reads it). Not actually a parity gap.

## Item 6 — Budget File Upload

Hosted on the Budgets page per mobile grouping ("Budget Management" section).

- **File:** `src/components/configuration/budget-upload-dialog.tsx` — self-contained Dialog.
- **Hooks:** `useUploadBudgetFileApi…Post` (lives in `configuration-v1`, not `budget-v1` — caught on first build failure), plus `useListFiscalYearsApi…` for the FY Select.
- **UI:** FY Select · native `<input type="file" accept=".xlsx,.xls,.csv">` · overwrite Switch · "Download template" and "Download current data" buttons · Upload button.
- **Downloads** use `apiRequest` with `responseType: "blob"` so the existing Bearer-token interceptor authenticates automatically; `URL.createObjectURL` + temporary `<a download>` + `URL.revokeObjectURL` cleans up. Filenames derived from FY code (`budgets-FY2025.xlsx`).
- **Orval typing quirk:** generated `Body.file` is `string`, but the runtime mutator appends directly to FormData. Cast `file as unknown as string` with an explanatory comment.
- Separate loading states (`isDownloading`, `isUploading`) so the buttons don't interfere with each other.

## Mobile parity items intentionally not implemented

- **`tax_code_mapping` editor** — mobile generates the model but no screen surfaces it.
- **Platform admin portal parity** — web-only surface; no mobile counterpart.
- **Alert thresholds on Budget entities** — backend schema is `{[k: string]: unknown}[]`, shape not confirmed. Defer until shape is pinned.

## Cross-cutting notes from the parity work

- **Singleton form pattern** (used on 5 pages: Policy, Budget Rules, Accounting, Fiscal Year Config, Committee Settings, Default Approvers): `useEffect(() => reset(defaultValues), …)` after fetch; `query: { enabled: !!organizationId, retry: false }`; amber "no config yet" banner on 404; Save button disabled when `!isDirty && hasExisting`; POST if no `data?.id`, PUT otherwise (or PATCH where exposed).
- **Fetch-merge-PUT pattern** for `AccountingConfiguration` (shared record): always spread the loaded record into the payload before overlaying form changes. Any future page that edits a subset of the same record must follow this.
- **Opaque-list shape handling** (FY list, allocation-rule list, budget list): accept either bare `[]` or wrapped `{items: [...]}` at the call site. All pages share the same normalization code.
- **`configuration:write` / `budgets:write` / etc. permissions** are ambient on every path inside `/configuration` — the layout's `RequireRole(CORPORATE_ADMIN)` gate catches non-admins before any in-page permission check runs. Per-button `<Can>` wrappers are still appropriate for future role flexibility.
