import { kaizenAdminRequest } from "./api-client";
import { hasPermission, PERMISSION } from "./authorization";
import type { UserDto } from "./generated/user/models/userDto";

/**
 * Onboarding wizard helpers.
 *
 * The backend exposes `GET /api/v1/configuration/{orgId}/setup-status` as
 * the single source of truth for "is this org configured enough?". It
 * returns dependency-ordered `blocking_issues[]`; the wizard resolves them
 * top-down. Swap the hand-rolled fetch below for the generated Orval hook
 * once the endpoint lands in the spec.
 */

// ── Response shapes ────────────────────────────────────────────────────

export type IssueCode =
  | "no_default_currency"
  | "require_budget_lines_without_active_budget"
  | "no_approval_levels"
  | "approval_coverage_gap"
  | "committee_enabled_without_committees"
  | "no_fiscal_year_active"
  // Unknown codes are rendered by the UnknownIssueStep fallback.
  | (string & Record<never, never>);

export type RemedyStep =
  | "accounting"
  | "budgets"
  | "approval_levels"
  | "committee"
  | "fiscal_year"
  | (string & Record<never, never>);

export interface SetupIssueDetails {
  gaps?: Array<{ range: string; message: string }>;
  [key: string]: unknown;
}

export interface BlockingIssue {
  code: IssueCode;
  message: string;
  remedy_step: RemedyStep;
  details: SetupIssueDetails | null;
}

export type SetupWarning = BlockingIssue;

export interface SetupStatusResponse {
  setup_complete: boolean;
  blocking_issues: BlockingIssue[];
  warnings: SetupWarning[];
}

// ── Fetch ──────────────────────────────────────────────────────────────

/**
 * TODO(spec-sync): once the remote OpenAPI exposes this endpoint, swap to
 * the generated Orval hook (likely `useGetSetupStatusApiV1Configuration…`)
 * and drop this hand-rolled helper. Callers already go through React
 * Query, so the replacement is a drop-in.
 */
export async function getSetupStatus(
  organizationId: number,
): Promise<SetupStatusResponse> {
  return kaizenAdminRequest<SetupStatusResponse>({
    url: `/api/v1/configuration/${organizationId}/setup-status`,
    method: "GET",
  });
}

// ── Wizard step identifiers (client-side) ──────────────────────────────

export const WIZARD_STEP = {
  intro: "intro",
  committee_settings: "committee_settings",
  accounting: "accounting",
  approval_levels: "approval_levels",
  fiscal_year_config: "fiscal_year_config",
  fiscal_year: "fiscal_year",
  budgets: "budgets",
  committee: "committee",
  unknown: "unknown",
  done: "done",
} as const;

export type WizardStepId = (typeof WIZARD_STEP)[keyof typeof WIZARD_STEP];

/**
 * Map a backend `remedy_step` / `code` to the client-side step we render.
 * Phase 1 only implements a subset — the rest fall through to
 * `unknown` and render UnknownIssueStep (link out to /configuration/...).
 */
export function resolveWizardStep(
  code: IssueCode,
  remedyStep: RemedyStep,
): WizardStepId {
  switch (code) {
    case "no_default_currency":
      return WIZARD_STEP.accounting;
    case "no_approval_levels":
    case "approval_coverage_gap":
      return WIZARD_STEP.approval_levels;
    case "committee_enabled_without_committees":
      return WIZARD_STEP.committee_settings;
    case "require_budget_lines_without_active_budget":
      return WIZARD_STEP.budgets;
    case "no_fiscal_year_active":
      return WIZARD_STEP.fiscal_year;
    default:
      // Try the remedy_step as a last resort so future codes with a known
      // remedy_step don't degrade to the unknown fallback.
      if (remedyStep === "accounting") return WIZARD_STEP.accounting;
      if (remedyStep === "approval_levels") return WIZARD_STEP.approval_levels;
      if (remedyStep === "committee") return WIZARD_STEP.committee_settings;
      if (remedyStep === "budgets") return WIZARD_STEP.budgets;
      if (remedyStep === "fiscal_year") return WIZARD_STEP.fiscal_year;
      return WIZARD_STEP.unknown;
  }
}

// ── Intro answers (client-side preamble) ───────────────────────────────

export interface IntroAnswers {
  /** ISO 4217 code. */
  default_currency: string;
  /** 1–12 */
  fiscal_year_start_month: number;
  /** 1–31 */
  fiscal_year_start_day: number;
  /** If true, wizard follows Path B (FY + budget steps). */
  enforce_budgets: boolean;
  /** If true, wizard will prompt for committee creation (Phase 3). */
  use_committees: boolean;
}

const INTRO_STORAGE_PREFIX = "onboarding_intro_";

function introStorageKey(organizationId: number): string {
  return `${INTRO_STORAGE_PREFIX}${organizationId}`;
}

export function loadIntroAnswers(
  organizationId: number,
): IntroAnswers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(introStorageKey(organizationId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<IntroAnswers>;
    if (
      typeof parsed.default_currency !== "string" ||
      typeof parsed.fiscal_year_start_month !== "number" ||
      typeof parsed.fiscal_year_start_day !== "number" ||
      typeof parsed.enforce_budgets !== "boolean" ||
      typeof parsed.use_committees !== "boolean"
    ) {
      return null;
    }
    return parsed as IntroAnswers;
  } catch {
    return null;
  }
}

export function saveIntroAnswers(
  organizationId: number,
  answers: IntroAnswers,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      introStorageKey(organizationId),
      JSON.stringify(answers),
    );
  } catch {
    // Storage quota / private mode — non-fatal. The wizard falls back to
    // in-memory state via the caller's useState.
  }
}

export function clearIntroAnswers(organizationId: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(introStorageKey(organizationId));
  } catch {
    // Non-fatal.
  }
}

// ── Wizard eligibility ─────────────────────────────────────────────────

/**
 * True if the user can *run* the onboarding wizard — i.e. the PATCH/POST
 * endpoints the wizard writes to will succeed for them. Per
 * `Minimum_Viable_Configuration.md`, this requires configuration-edit
 * capability:
 *   - `configuration:write`  (explicit)
 *   - `configuration:*`      (resource wildcard — handled by hasPermission)
 *   - `admin:*`              (super-wildcard — handled by hasPermission)
 *   - `*`                    (global wildcard — handled by hasPermission)
 *
 * Users who only have `configuration:read` can call `GET /setup-status`
 * but should NOT be routed into the wizard; they should see the
 * pending-configuration screen instead.
 */
export function canRunOnboardingWizard(
  user: UserDto | null | undefined,
): boolean {
  if (!user) return false;
  return hasPermission(user, PERMISSION.CONFIGURATION_WRITE);
}

/**
 * True if the user can at least *see* setup-status — every authenticated
 * org member should, since read capability is a prerequisite for the
 * banner / pending-configuration screen.
 */
export function canReadSetupStatus(
  user: UserDto | null | undefined,
): boolean {
  if (!user) return false;
  return hasPermission(user, PERMISSION.CONFIGURATION_READ);
}

// ── React Query key factory ────────────────────────────────────────────

export function setupStatusQueryKey(organizationId: number): [string, number] {
  return ["onboarding:setup-status", organizationId];
}
