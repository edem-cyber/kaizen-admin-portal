"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  canRunOnboardingWizard,
  getSetupStatus,
  loadIntroAnswers,
  resolveWizardStep,
  setupStatusQueryKey,
  WIZARD_STEP,
  type IntroAnswers,
  type SetupStatusResponse,
  type WizardStepId,
} from "@/lib/onboarding";
import type { UserDto } from "@/lib/generated/user/models/userDto";
import { PendingConfigurationView } from "./pending-configuration-view";
import { extractErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, ChevronRight, CircleDashed, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

import { IntroStep } from "./steps/intro-step";
import { CommitteeSettingsStep } from "./steps/committee-settings-step";
import { CommitteeCreationStep } from "./steps/committee-creation-step";
import { AccountingStep } from "./steps/accounting-step";
import { ApprovalLevelsStep } from "./steps/approval-levels-step";
import { FiscalYearConfigStep } from "./steps/fiscal-year-config-step";
import { FiscalYearStep } from "./steps/fiscal-year-step";
import { BudgetStep } from "./steps/budget-step";
import { DoneStep } from "./steps/done-step";
import { UnknownIssueStep } from "./steps/unknown-issue-step";
import {
  useGetFiscalYearConfigApiV1BudgetFiscalYearConfigOrganizationIdGet,
  useListFiscalYearsApiV1BudgetFiscalYearsGet,
} from "@/lib/generated/kaizenAdmin/budget-v1/budget-v1";
import { extractItems } from "@/lib/list-response";

const STEP_LABELS: Record<WizardStepId, string> = {
  intro: "Welcome",
  committee_settings: "Committees",
  accounting: "Currency & accounting",
  approval_levels: "Approvers",
  fiscal_year_config: "Fiscal year (setup)",
  fiscal_year: "Fiscal year",
  budgets: "Budget",
  committee: "Committee",
  unknown: "Additional setup",
  done: "Done",
};

export function WizardShell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  const [introAnswers, setIntroAnswers] = useState<IntroAnswers | null>(() =>
    organizationId ? loadIntroAnswers(organizationId) : null,
  );

  // Steps the user has visited, in order. Append-only, deduped. Used to
  // support Back navigation and the clickable progress rail. Seeded with
  // intro so returning users (whose intro answers persist in localStorage)
  // can still navigate back to the welcome screen — otherwise the driver
  // skips intro entirely and Back has nowhere to go from the first step.
  const [history, setHistory] = useState<WizardStepId[]>([WIZARD_STEP.intro]);
  // When set, the shell renders this step instead of the driver-derived
  // one. Cleared whenever the user saves or clicks "Next" past the tip.
  const [overrideStep, setOverrideStep] = useState<WizardStepId | null>(null);

  const {
    data: status,
    isLoading,
    error,
  } = useQuery<SetupStatusResponse>({
    queryKey: organizationId
      ? setupStatusQueryKey(organizationId)
      : ["onboarding:setup-status", "_no_org"],
    queryFn: () => getSetupStatus(organizationId as number),
    enabled: !!organizationId,
    refetchOnWindowFocus: false,
  });

  // Prerequisite state for Path B: when setup-status flags
  // require_budget_lines_without_active_budget, we drill down to whichever
  // of FY config / FY instance / Budget is actually missing.
  const { data: fyConfigData } =
    useGetFiscalYearConfigApiV1BudgetFiscalYearConfigOrganizationIdGet(
      organizationId ?? 0,
      { query: { enabled: !!organizationId, retry: false } },
    );
  const { data: fiscalYearsData } = useListFiscalYearsApiV1BudgetFiscalYearsGet(
    organizationId ? { organization_id: organizationId, limit: 50 } : undefined,
    { query: { enabled: !!organizationId } },
  );

  const hasFyConfig = !!(fyConfigData as { id?: string } | undefined)?.id;
  const hasFiscalYear = useMemo(() => {
    return (
      extractItems<{ id?: string }>(fiscalYearsData, "fiscal_years").filter(
        (fy) => !!fy?.id,
      ).length > 0
    );
  }, [fiscalYearsData]);

  const refetchStatus = () => {
    if (!organizationId) return;
    queryClient.invalidateQueries({
      queryKey: setupStatusQueryKey(organizationId),
    });
    // Also invalidate Phase 2 prereq queries so the derived step re-evaluates
    // once FY config / FY instance / budget are created. Orval-generated
    // keys are URL paths like `/api/v1/budget/fiscal-year-config/{id}`.
    queryClient.invalidateQueries({
      predicate: (q) => {
        const k = q.queryKey?.[0];
        if (typeof k !== "string") return false;
        return (
          k.startsWith("/api/v1/budget/fiscal-year-config") ||
          k.startsWith("/api/v1/budget/fiscal-years") ||
          k.startsWith("/api/v1/budget/budgets") ||
          // Approval-levels list is consulted by ApprovalLevelsStep.
          k.startsWith("/api/v1/configuration/approval-levels") ||
          // Committee list + committee-settings touched by Phase 3 steps.
          k.startsWith("/api/v1/committees") ||
          (k.startsWith("/api/v1/configuration/") &&
            k.includes("/committee-settings"))
        );
      },
    });
  };

  // Step the driver would show if we weren't overriding.
  const derivedStep: WizardStepId = useMemo(() => {
    if (!status) return WIZARD_STEP.intro;
    if (!introAnswers) return WIZARD_STEP.intro;
    if (status.setup_complete) return WIZARD_STEP.done;
    const issue = status.blocking_issues[0];
    if (!issue) return WIZARD_STEP.done;
    const resolved = resolveWizardStep(issue.code, issue.remedy_step);

    // Committee branching: resolveWizardStep defaults to committee_settings
    // (the "disable gates" path). If the user chose "yes, use committees"
    // in the intro, steer to CommitteeCreationStep instead — that step
    // creates the committee AND flips the flags back on.
    if (
      resolved === WIZARD_STEP.committee_settings &&
      introAnswers.use_committees
    ) {
      return WIZARD_STEP.committee;
    }

    // Path B: the backend surfaces "require_budget_lines_without_active_budget"
    // once accounting has require_budget_lines=true. Drill into the actual
    // missing prerequisite (FY config → FY instance → budget) so the user
    // sees each as its own wizard step rather than landing on the final form
    // with dependencies implicitly unmet.
    if (resolved === WIZARD_STEP.budgets) {
      if (!hasFyConfig) return WIZARD_STEP.fiscal_year_config;
      if (!hasFiscalYear) return WIZARD_STEP.fiscal_year;
    }

    return resolved;
  }, [status, introAnswers, hasFyConfig, hasFiscalYear]);

  const currentStep: WizardStepId = overrideStep ?? derivedStep;

  // Keep `history` in sync with `derivedStep` during render so the Back
  // button is available immediately on the same frame the driver advances.
  // This is the React "update state during render" pattern: the setState
  // call is guarded by a condition that becomes false after one update,
  // so no infinite loop.
  if (!history.includes(derivedStep)) {
    setHistory((prev) =>
      prev.includes(derivedStep) ? prev : [...prev, derivedStep],
    );
  }

  // Effective history used for navigation math — includes the current
  // derivedStep even on the render where `history` hasn't been committed
  // yet (e.g. the very first time the driver surfaces a new step).
  const effectiveHistory = history.includes(derivedStep)
    ? history
    : [...history, derivedStep];

  const currentIdx = effectiveHistory.indexOf(currentStep);
  const canGoBack = currentIdx > 0;

  const handleBack = () => {
    if (!canGoBack) return;
    setOverrideStep(effectiveHistory[currentIdx - 1]);
  };

  const handleJumpTo = (step: WizardStepId) => {
    if (!effectiveHistory.includes(step)) return;
    if (step === derivedStep) {
      setOverrideStep(null);
    } else {
      setOverrideStep(step);
    }
  };

  const clearOverride = () => setOverrideStep(null);

  if (!organizationId) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Organization not found. Sign out and back in to continue.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-8 space-y-3 text-center">
          <p className="text-sm font-medium text-destructive">
            Couldn&rsquo;t load your organization&rsquo;s setup status.
          </p>
          <p className="text-xs text-muted-foreground">
            {extractErrorMessage(error, "Please try again.")}
          </p>
          <Button size="sm" onClick={refetchStatus}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  // Users without configuration-edit capability see a read-only
  // "pending configuration" view instead of the wizard. The wizard's
  // PATCH/POST calls would all fail for them anyway.
  if (!canRunOnboardingWizard(user as UserDto | null)) {
    return <PendingConfigurationView status={status} />;
  }

  const currentIssue = status.blocking_issues[0] ?? null;
  const backProps = canGoBack
    ? {
        onBack: handleBack,
        backLabel: STEP_LABELS[effectiveHistory[currentIdx - 1]] ?? "Back",
      }
    : {};

  const renderedStep = renderStep({
    step: currentStep,
    organizationId,
    introAnswers,
    status,
    onIntroComplete: (answers) => {
      setIntroAnswers(answers);
      clearOverride();
    },
    onStepComplete: () => {
      clearOverride();
      refetchStatus();
    },
    onFinish: () => {
      toast.success("Setup complete");
      router.push("/admin");
    },
    backProps,
  });

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Let&rsquo;s set up your workspace</h1>
          <p className="text-sm text-muted-foreground">
            A few quick questions to get your team ready to create and approve kaizenAdmins.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <ProgressRail
          currentStep={currentStep}
          status={status}
          introComplete={!!introAnswers}
          visitedSteps={effectiveHistory}
          onJump={handleJumpTo}
        />
        <div>
          {currentIssue && currentStep !== WIZARD_STEP.done && currentStep !== WIZARD_STEP.intro && (
            <Card className="mb-4 border-amber-200 bg-amber-50/60">
              <CardContent className="p-4 text-sm text-amber-900">
                <p className="font-medium">Next thing to resolve</p>
                <p className="text-xs mt-1">{currentIssue.message}</p>
              </CardContent>
            </Card>
          )}
          {renderedStep}
        </div>
      </div>
    </div>
  );
}

export interface WizardBackProps {
  onBack?: () => void;
  backLabel?: string;
}

interface RenderStepArgs {
  step: WizardStepId;
  organizationId: number;
  introAnswers: IntroAnswers | null;
  status: SetupStatusResponse;
  onIntroComplete: (answers: IntroAnswers) => void;
  onStepComplete: () => void;
  onFinish: () => void;
  backProps: WizardBackProps;
}

function renderStep(args: RenderStepArgs) {
  const {
    step,
    organizationId,
    introAnswers,
    status,
    onIntroComplete,
    onStepComplete,
    onFinish,
    backProps,
  } = args;

  switch (step) {
    case WIZARD_STEP.intro:
      return (
        <IntroStep
          organizationId={organizationId}
          initialAnswers={introAnswers}
          onComplete={onIntroComplete}
        />
      );
    case WIZARD_STEP.committee_settings:
      return (
        <CommitteeSettingsStep
          organizationId={organizationId}
          introAnswers={introAnswers}
          onComplete={onStepComplete}
          {...backProps}
        />
      );
    case WIZARD_STEP.committee:
      return (
        <CommitteeCreationStep
          organizationId={organizationId}
          onComplete={onStepComplete}
          {...backProps}
        />
      );
    case WIZARD_STEP.accounting:
      return (
        <AccountingStep
          organizationId={organizationId}
          introAnswers={introAnswers}
          onComplete={onStepComplete}
          {...backProps}
        />
      );
    case WIZARD_STEP.approval_levels:
      return (
        <ApprovalLevelsStep
          organizationId={organizationId}
          currentIssue={status.blocking_issues[0] ?? null}
          onComplete={onStepComplete}
          {...backProps}
        />
      );
    case WIZARD_STEP.fiscal_year_config:
      return (
        <FiscalYearConfigStep
          organizationId={organizationId}
          introAnswers={introAnswers}
          onComplete={onStepComplete}
          {...backProps}
        />
      );
    case WIZARD_STEP.fiscal_year:
      return (
        <FiscalYearStep
          organizationId={organizationId}
          onComplete={onStepComplete}
          {...backProps}
        />
      );
    case WIZARD_STEP.budgets:
      return (
        <BudgetStep
          organizationId={organizationId}
          introAnswers={introAnswers}
          onComplete={onStepComplete}
          {...backProps}
        />
      );
    case WIZARD_STEP.done:
      return <DoneStep onFinish={onFinish} {...backProps} />;
    default:
      return (
        <UnknownIssueStep
          issue={status.blocking_issues[0] ?? null}
          onDone={onStepComplete}
          {...backProps}
        />
      );
  }
}

function ProgressRail({
  currentStep,
  status,
  introComplete,
  visitedSteps,
  onJump,
}: {
  currentStep: WizardStepId;
  status: SetupStatusResponse;
  introComplete: boolean;
  visitedSteps: WizardStepId[];
  onJump: (step: WizardStepId) => void;
}) {
  // Derive a stable ordered list of steps to show in the progress rail.
  // Union of visitedSteps (things the user has seen, even if resolved)
  // and still-pending steps from blocking_issues, plus Done at the end.
  const steps = useMemo<WizardStepId[]>(() => {
    const out: WizardStepId[] = [];
    const push = (s: WizardStepId) => {
      if (!out.includes(s)) out.push(s);
    };
    push(WIZARD_STEP.intro);
    for (const s of visitedSteps) push(s);
    for (const issue of status.blocking_issues) {
      push(resolveWizardStep(issue.code, issue.remedy_step));
    }
    push(WIZARD_STEP.done);
    return out;
  }, [visitedSteps, status]);

  const visitedSet = new Set<WizardStepId>(visitedSteps);
  const currentIdx = steps.indexOf(currentStep);

  // Shared per-step state derivation — used by both the compact mobile
  // stepper and the full desktop rail.
  const stepState = (s: WizardStepId) => {
    const thisIdx = steps.indexOf(s);
    const isCurrent = s === currentStep;
    const isPastIntro = introComplete && currentStep !== WIZARD_STEP.intro;
    const isDone =
      s === WIZARD_STEP.intro
        ? isPastIntro
        : s === WIZARD_STEP.done
          ? status.setup_complete
          : currentIdx > thisIdx;
    const isClickable = !isCurrent && visitedSet.has(s);
    return { isCurrent, isDone, isClickable };
  };

  return (
    <div>
      {/* Compact horizontal stepper for phones/tablets. The full rail
          hogs vertical real estate above the form on narrow screens —
          this variant condenses the same info into a header strip. */}
      <div className="lg:hidden rounded-lg border bg-card px-3 py-2.5 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
            Step {Math.max(1, currentIdx + 1)} of {steps.length}
          </p>
          <p className="text-xs font-medium truncate">
            {STEP_LABELS[currentStep] ?? currentStep}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {steps.map((s) => {
            const { isCurrent, isDone, isClickable } = stepState(s);
            const label = STEP_LABELS[s] ?? s;
            const bg = isCurrent
              ? "bg-primary"
              : isDone
                ? "bg-primary/50"
                : "bg-muted";
            const barClass = cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              bg,
            );
            return isClickable ? (
              <button
                key={s}
                type="button"
                onClick={() => onJump(s)}
                aria-label={label}
                title={label}
                className={cn(barClass, "cursor-pointer hover:bg-primary/70")}
              />
            ) : (
              <div
                key={s}
                aria-label={label}
                title={label}
                className={barClass}
              />
            );
          })}
        </div>
      </div>

      {/* Full vertical rail for desktop. */}
      <Card className="hidden lg:block h-fit">
        <CardContent className="p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Progress
          </p>
          {steps.map((s) => {
            const label = STEP_LABELS[s] ?? s;
            const { isCurrent, isDone, isClickable } = stepState(s);

            const baseClass = cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm w-full text-left",
              isCurrent && "bg-primary/10 text-primary font-medium",
              !isCurrent && isDone && "text-muted-foreground",
              isClickable && "hover:bg-muted cursor-pointer",
              !isClickable && !isCurrent && "cursor-default",
            );

            const content = (
              <>
                {isDone ? (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                ) : (
                  <CircleDashed className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                )}
                <span className="truncate">{label}</span>
                {isCurrent && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
              </>
            );

            return isClickable ? (
              <button
                key={s}
                type="button"
                onClick={() => onJump(s)}
                className={baseClass}
              >
                {content}
              </button>
            ) : (
              <div key={s} className={baseClass}>
                {content}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
