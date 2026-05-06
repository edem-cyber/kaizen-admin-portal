"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AccountingReferenceFieldsProps {
  requireGlAccount: boolean;
  requireProjectCode: boolean;
  glAccount?: string;
  projectCode?: string;
  onGlAccountChange: (v: string) => void;
  onProjectCodeChange: (v: string) => void;
  glAccountError?: string;
  projectCodeError?: string;
  disabled?: boolean;
}

/**
 * Optional accounting-reference inputs (GL account, project code) that
 * render only when the org's accounting_config flags them as required.
 * Both values flow into the requisition payload via `metadata` per
 * Kaizen Admin_Form_Selection.md — `Kaizen AdminCreate` has no first-class
 * fields for these today. When the backend adds them, this component can
 * be migrated to top-level fields without changing its prop surface.
 */
export function AccountingReferenceFields({
  requireGlAccount,
  requireProjectCode,
  glAccount,
  projectCode,
  onGlAccountChange,
  onProjectCodeChange,
  glAccountError,
  projectCodeError,
  disabled,
}: AccountingReferenceFieldsProps) {
  if (!requireGlAccount && !requireProjectCode) return null;

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div>
        <p className="text-sm font-medium">Accounting references</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Required by your organization&rsquo;s accounting policy.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {requireGlAccount && (
          <div className="space-y-2">
            <Label htmlFor="gl_account">
              GL account <span className="text-destructive">*</span>
            </Label>
            <Input
              id="gl_account"
              placeholder="e.g. 6000-100"
              value={glAccount ?? ""}
              onChange={(e) => onGlAccountChange(e.target.value)}
              disabled={disabled}
              aria-invalid={!!glAccountError}
              className={cn(
                glAccountError &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {glAccountError && (
              <p className="text-xs text-destructive">{glAccountError}</p>
            )}
          </div>
        )}
        {requireProjectCode && (
          <div className="space-y-2">
            <Label htmlFor="project_code">
              Project code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project_code"
              placeholder="e.g. PRJ-123"
              value={projectCode ?? ""}
              onChange={(e) => onProjectCodeChange(e.target.value)}
              disabled={disabled}
              aria-invalid={!!projectCodeError}
              className={cn(
                projectCodeError &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {projectCodeError && (
              <p className="text-xs text-destructive">{projectCodeError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
