"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { BudgetResponse } from "@/lib/generated/kaizenAdmin/models";
import { useListFiscalYearsApiV1BudgetFiscalYearsGet, useListBudgetsApiV1BudgetBudgetsGet } from "@/lib/generated/kaizenAdmin/budget-v1/budget-v1";
import { useGetAccountingConfigurationApiV1ConfigurationOrganizationIdAccountingGet } from "@/lib/generated/kaizenAdmin/configuration-v1/configuration-v1";
import { useGetOrganizationGroups } from "@/lib/generated/org/organization-groups/organization-groups";
import { extractItems } from "@/lib/list-response";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const numericString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, "Enter a valid non-negative number");

const budgetSchema = z
  .object({
    budget_code: z.string().trim().min(1, "Code is required"),
    budget_name: z.string().trim().min(1, "Name is required"),
    description: z.string().optional().or(z.literal("")),
    fiscal_year_id: z.string().min(1, "Select a fiscal year"),
    total_budget: numericString,
    currency_code: z
      .string()
      .trim()
      .max(3, "Use a 3-letter currency code")
      .optional()
      .or(z.literal("")),
    cost_center: z.string().optional().or(z.literal("")),
    project_code: z.string().optional().or(z.literal("")),
    parent_budget_id: z.string().optional().or(z.literal("")),
    department_id: z.string().optional().or(z.literal("")),
    allow_overrun: z.boolean(),
    overrun_percentage: z
      .number()
      .min(0, "Must be 0–100")
      .max(100, "Must be 0–100"),
    require_approval_on_overrun: z.boolean(),
    auto_approve_threshold: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (
      data.auto_approve_threshold &&
      !/^\d+(\.\d+)?$/.test(data.auto_approve_threshold)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["auto_approve_threshold"],
        message: "Enter a valid non-negative number",
      });
    }
  });

type BudgetFormValues = z.infer<typeof budgetSchema>;

export interface BudgetFormSubmit {
  budget_code: string;
  budget_name: string;
  description: string | null;
  fiscal_year_id: string;
  total_budget: number;
  currency_code: string | null;
  cost_center: string | null;
  project_code: string | null;
  parent_budget_id: string | null;
  department_id: number | null;
  allow_overrun: boolean;
  overrun_percentage: number;
  require_approval_on_overrun: boolean;
  auto_approve_threshold: number | null;
}

interface FiscalYearOption {
  id: string;
  year_code?: string;
  year_name?: string;
}

interface BudgetFormProps {
  organizationId: number;
  initialData?: {
    budget_code?: string;
    budget_name?: string;
    description?: string | null;
    fiscal_year_id?: string;
    total_budget?: string | number;
    currency_code?: string;
    cost_center?: string;
    project_code?: string;
    parent_budget_id?: string;
    department_id?: number | string | null;
    allow_overrun?: boolean;
    overrun_percentage?: number;
    require_approval_on_overrun?: boolean;
    auto_approve_threshold?: number | string | null;
  };
  onSubmit: (data: BudgetFormSubmit) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  mode?: "create" | "edit";
  defaultCurrency?: string;
}

export function BudgetForm({
  organizationId,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save",
  mode = "create",
  defaultCurrency,
}: BudgetFormProps) {
  const { data: fiscalYearsData } = useListFiscalYearsApiV1BudgetFiscalYearsGet(
    {
      organization_id: organizationId,
      is_active: true,
      limit: 100,
    },
    { query: { enabled: !!organizationId } },
  );

  const { data: budgetsDataUntyped } = useListBudgetsApiV1BudgetBudgetsGet(
    { organization_id: organizationId, limit: 100 },
    { query: { enabled: !!organizationId } },
  );

  const budgetsData = budgetsDataUntyped as { items?: Array<{ budget_id: string; budget_code: string; budget_name: string }> } | undefined;

  const { data: groupsData } = useGetOrganizationGroups(
    { limit: 100 },
    { query: { enabled: !!organizationId } },
  );

  const fiscalYears = useMemo<FiscalYearOption[]>(() => {
    return extractItems<FiscalYearOption>(fiscalYearsData, "fiscal_years").filter(
      (r) => !!r?.id,
    );
  }, [fiscalYearsData]);

  const { data: accountingConfig } =
    useGetAccountingConfigurationApiV1ConfigurationOrganizationIdAccountingGet(
      organizationId,
      { query: { enabled: !!organizationId, retry: false } },
    );

  const currencyOptions = useMemo<string[]>(() => {
    const defaultCode =
      accountingConfig?.default_currency ?? defaultCurrency ?? null;
    const supported = Array.isArray(accountingConfig?.supported_currencies)
      ? (accountingConfig?.supported_currencies as string[])
      : [];
    const allowMulti = accountingConfig?.allow_multi_currency !== false;

    // If multi-currency is disabled, restrict to the default currency only.
    const list = !allowMulti && defaultCode ? [defaultCode] : supported;

    // Ensure the default is present at the top, then unique uppercase codes.
    const all = [defaultCode, ...list].filter(
      (c): c is string => typeof c === "string" && c.trim().length > 0,
    );
    const seen = new Set<string>();
    const result: string[] = [];
    for (const code of all) {
      const upper = code.toUpperCase();
      if (seen.has(upper)) continue;
      seen.add(upper);
      result.push(upper);
    }
    return result;
  }, [accountingConfig, defaultCurrency]);

  const effectiveDefaultCurrency =
    accountingConfig?.default_currency ?? defaultCurrency ?? "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      budget_code: initialData?.budget_code ?? "",
      budget_name: initialData?.budget_name ?? "",
      description: (initialData?.description as string) ?? "",
      fiscal_year_id: initialData?.fiscal_year_id ?? "",
      total_budget:
        typeof initialData?.total_budget === "string"
          ? initialData.total_budget
          : initialData?.total_budget != null
            ? String(initialData.total_budget)
            : "",
      currency_code:
        initialData?.currency_code ?? defaultCurrency ?? "",
      cost_center: initialData?.cost_center ?? "",
      project_code: initialData?.project_code ?? "",
      parent_budget_id: initialData?.parent_budget_id ?? "",
      department_id: initialData?.department_id != null ? String(initialData.department_id) : "",
      allow_overrun: initialData?.allow_overrun ?? false,
      overrun_percentage: initialData?.overrun_percentage ?? 0,
      require_approval_on_overrun: initialData?.require_approval_on_overrun ?? true,
      auto_approve_threshold:
        initialData?.auto_approve_threshold != null
          ? String(initialData.auto_approve_threshold)
          : "",
    },
  });


  const fiscalYearId = watch("fiscal_year_id");
  const currencyCode = watch("currency_code");
  const allowOverrun = watch("allow_overrun");
  const isEdit = mode === "edit";

  // When the accounting config lands after mount and the currency is still
  // empty (Create mode, no initial data), preselect the org default.
  useEffect(() => {
    if (!effectiveDefaultCurrency) return;
    if (currencyCode && currencyCode.length > 0) return;
    setValue("currency_code", effectiveDefaultCurrency, {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [effectiveDefaultCurrency, currencyCode, setValue]);

  const submit = (values: BudgetFormValues) => {
    onSubmit({
      budget_code: values.budget_code.trim(),
      budget_name: values.budget_name.trim(),
      description: values.description?.trim() || null,
      fiscal_year_id: values.fiscal_year_id,
      total_budget: Number(values.total_budget),
      currency_code: values.currency_code?.trim() || null,
      cost_center: values.cost_center?.trim() || null,
      project_code: values.project_code?.trim() || null,
      parent_budget_id: values.parent_budget_id === "none" ? null : values.parent_budget_id || null,
      department_id: values.department_id === "none" || !values.department_id ? null : Number(values.department_id),
      allow_overrun: values.allow_overrun,
      overrun_percentage: values.overrun_percentage,
      require_approval_on_overrun: values.require_approval_on_overrun,
      auto_approve_threshold: values.auto_approve_threshold
        ? Number(values.auto_approve_threshold)
        : null,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6 pt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget_code">Code</Label>
          <Input
            id="budget_code"
            placeholder="e.g. OPS-2026"
            {...register("budget_code")}
            disabled={isEdit}
          />
          {isEdit && (
            <p className="text-xs text-muted-foreground">Code can&rsquo;t be changed after creation.</p>
          )}
          {errors.budget_code && (
            <p className="text-xs text-destructive">{errors.budget_code.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget_name">Name</Label>
          <Input
            id="budget_name"
            placeholder="Operations 2026"
            {...register("budget_name")}
          />
          {errors.budget_name && (
            <p className="text-xs text-destructive">{errors.budget_name.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={2}
          placeholder="Scope and purpose of this budget."
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fiscal year</Label>
          <Select
            value={fiscalYearId || undefined}
            onValueChange={(v) =>
              setValue("fiscal_year_id", v, { shouldValidate: true })
            }
            disabled={isEdit}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a fiscal year" />
            </SelectTrigger>
            <SelectContent>
              {fiscalYears.map((fy) => (
                <SelectItem key={fy.id} value={fy.id}>
                  {fy.year_name ?? fy.year_code ?? fy.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isEdit && (
            <p className="text-xs text-muted-foreground">
              Fiscal year can&rsquo;t be changed after creation.
            </p>
          )}
          {errors.fiscal_year_id && (
            <p className="text-xs text-destructive">{errors.fiscal_year_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_budget">Total budget</Label>
          <Input
            id="total_budget"
            inputMode="decimal"
            placeholder="0"
            {...register("total_budget")}
          />
          {errors.total_budget && (
            <p className="text-xs text-destructive">{errors.total_budget.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currency_code">Currency</Label>
          {currencyOptions.length > 0 ? (
            <Select
              value={currencyCode || undefined}
              onValueChange={(v) =>
                setValue("currency_code", v, { shouldValidate: true })
              }
              disabled={isEdit}
            >
              <SelectTrigger id="currency_code">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                    {code === effectiveDefaultCurrency && (
                      <span className="text-xs text-muted-foreground ml-1">(default)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="currency_code"
              placeholder={defaultCurrency ?? "USD"}
              maxLength={3}
              {...register("currency_code")}
              disabled={isEdit}
              onChange={(e) =>
                setValue("currency_code", e.target.value.toUpperCase(), {
                  shouldValidate: true,
                })
              }
            />
          )}
          {errors.currency_code && (
            <p className="text-xs text-destructive">{errors.currency_code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="auto_approve_threshold">Auto-approve threshold</Label>
          <Input
            id="auto_approve_threshold"
            inputMode="decimal"
            placeholder="Leave blank to disable"
            {...register("auto_approve_threshold")}
          />
          <p className="text-xs text-muted-foreground">
            KaizenAdmins under this amount skip approval for this budget.
          </p>
          {errors.auto_approve_threshold && (
            <p className="text-xs text-destructive">
              {errors.auto_approve_threshold.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Parent Budget (Optional)</Label>
          <Select
            value={watch("parent_budget_id") || "none"}
            onValueChange={(v) => setValue("parent_budget_id", v === "none" ? "" : v, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a parent budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {budgetsData?.items?.map((b) => (
                <SelectItem key={b.budget_id} value={b.budget_id}>
                  {b.budget_name} ({b.budget_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Create a sub-budget under an existing budget.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Department (Optional)</Label>
          <Select
            value={watch("department_id") || "none"}
            onValueChange={(v) => setValue("department_id", v === "none" ? "" : v, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {groupsData?.data?.map((g) => (
                <SelectItem key={String(g.id)} value={String(g.id)}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cost_center">Cost center (optional)</Label>
          <Input
            id="cost_center"
            placeholder="e.g. CC-100"
            {...register("cost_center")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project_code">Project code (optional)</Label>
          <Input
            id="project_code"
            placeholder="e.g. PRJ-01"
            {...register("project_code")}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-border/60 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="allow_overrun" className="text-sm font-medium">
              Allow overrun
            </Label>
            <p className="text-xs text-muted-foreground">
              Permit kaizenAdmins to exceed this budget&rsquo;s total.
            </p>
          </div>
          <Switch
            id="allow_overrun"
            checked={allowOverrun}
            onCheckedChange={(v) =>
              setValue("allow_overrun", v, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </div>

        {allowOverrun && (
          <>
            <div className="space-y-2">
              <Label htmlFor="overrun_percentage">Overrun tolerance (%)</Label>
              <Input
                id="overrun_percentage"
                type="number"
                min={0}
                max={100}
                step={0.1}
                {...register("overrun_percentage", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Maximum percentage above the total budget before the overrun is blocked.
              </p>
              {errors.overrun_percentage && (
                <p className="text-xs text-destructive">
                  {errors.overrun_percentage.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label
                  htmlFor="require_approval_on_overrun"
                  className="text-sm font-medium"
                >
                  Require approval on overrun
                </Label>
                <p className="text-xs text-muted-foreground">
                  Force an additional approval when a kaizenAdmin goes over budget.
                </p>
              </div>
              <Switch
                id="require_approval_on_overrun"
                checked={watch("require_approval_on_overrun")}
                onCheckedChange={(v) =>
                  setValue("require_approval_on_overrun", v, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
